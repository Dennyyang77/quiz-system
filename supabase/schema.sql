-- ============================================
-- 盲生數學作答系統 - Supabase Database Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- Table: users
-- 使用者資料表（老師和學生）
-- ============================================
create table public.users (
    id uuid references auth.users on delete cascade not null default uuid_generate_v4(),
    email text unique not null,
    name text not null,
    role text not null check (role in ('teacher', 'student')) default 'student',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id)
);

-- RLS policies for users
alter table public.users enable row level security;

-- Users can read their own profile
create policy "Users can view own profile"
    on public.users for select
    using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
    on public.users for update
    using (auth.uid() = id);

-- Teachers can view all profiles (uses JWT to avoid recursion)
create policy "Teachers can view all profiles"
    on public.users for select
    using (
        (auth.jwt() ->> 'role') = 'teacher'
    );

-- ============================================
-- Table: quizzes
-- 試卷資料表
-- ============================================
create table public.quizzes (
    id uuid not null default uuid_generate_v4(),
    title text not null,
    description text,
    subject text not null,
    grade text not null,
    time_limit integer, -- in minutes, null means no limit
    status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
    created_by uuid references public.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id)
);

-- RLS policies for quizzes
alter table public.quizzes enable row level security;

-- Everyone can view published quizzes
create policy "Anyone can view published quizzes"
    on public.quizzes for select
    using (status = 'published');

-- Teachers can view their own quizzes
create policy "Teachers can view own quizzes"
    on public.quizzes for select
    using (created_by = auth.uid());

-- Teachers can create quizzes
create policy "Teachers can create quizzes"
    on public.quizzes for insert
    with check (created_by = auth.uid());

-- Teachers can update their own quizzes
create policy "Teachers can update own quizzes"
    on public.quizzes for update
    using (created_by = auth.uid());

-- Teachers can delete their own quizzes
create policy "Teachers can delete own quizzes"
    on public.quizzes for delete
    using (created_by = auth.uid());

-- ============================================
-- Table: questions
-- 題目資料表
-- ============================================
create table public.questions (
    id uuid not null default uuid_generate_v4(),
    quiz_id uuid references public.quizzes(id) on delete cascade not null,
    type text not null check (type in ('fill_in_blank', 'multiple_choice', 'math_expression', 'true_false')),
    question_text text not null,
    latex text,
    spoken text, -- Chinese text for NVDA screen reader
    options jsonb, -- For multiple choice: [{id: 'A', text: '...', latex: '...'}]
    correct_answer text not null,
    hint text,
    difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
    order_index integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id)
);

-- RLS policies for questions
alter table public.questions enable row level security;

-- Anyone can view questions for published quizzes
create policy "Anyone can view questions for published quizzes"
    on public.questions for select
    using (
        exists (
            select 1 from public.quizzes
            where quizzes.id = questions.quiz_id
            and quizzes.status = 'published'
        )
    );

-- Teachers can manage questions for their quizzes
create policy "Teachers can manage questions for own quizzes"
    on public.questions for all
    using (
        exists (
            select 1 from public.quizzes
            where quizzes.id = questions.quiz_id
            and quizzes.created_by = auth.uid()
        )
    );

-- ============================================
-- Table: quiz_sessions
-- 作答階段資料表
-- ============================================
create table public.quiz_sessions (
    id uuid not null default uuid_generate_v4(),
    quiz_id uuid references public.quizzes(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone,
    score numeric(5,2),
    total_questions integer not null default 0,
    correct_count integer,
    primary key (id),
    unique(quiz_id, user_id) -- One attempt per user per quiz
);

-- RLS policies for quiz_sessions
alter table public.quiz_sessions enable row level security;

-- Users can view their own sessions
create policy "Users can view own sessions"
    on public.quiz_sessions for select
    using (user_id = auth.uid());

-- Users can create their own sessions
create policy "Users can create own sessions"
    on public.quiz_sessions for insert
    with check (user_id = auth.uid());

-- Users can update their own sessions
create policy "Users can update own sessions"
    on public.quiz_sessions for update
    using (user_id = auth.uid());

-- Teachers can view all sessions for their quizzes
create policy "Teachers can view all sessions for own quizzes"
    on public.quiz_sessions for select
    using (
        exists (
            select 1 from public.quizzes
            where quizzes.id = quiz_sessions.quiz_id
            and quizzes.created_by = auth.uid()
        )
    );

-- ============================================
-- Table: responses
-- 作答記錄資料表
-- ============================================
create table public.responses (
    id uuid not null default uuid_generate_v4(),
    session_id uuid references public.quiz_sessions(id) on delete cascade not null,
    question_id uuid references public.questions(id) on delete cascade not null,
    answer text not null,
    is_correct boolean not null default false,
    time_spent integer not null default 0, -- in seconds
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id)
);

-- RLS policies for responses
alter table public.responses enable row level security;

-- Users can manage their own responses
create policy "Users can manage own responses"
    on public.responses for all
    using (
        exists (
            select 1 from public.quiz_sessions
            where quiz_sessions.id = responses.session_id
            and quiz_sessions.user_id = auth.uid()
        )
    );

-- Teachers can view responses for their quizzes
create policy "Teachers can view responses for own quizzes"
    on public.responses for select
    using (
        exists (
            select 1 from public.quiz_sessions
            join public.quizzes on quizzes.id = quiz_sessions.quiz_id
            where quiz_sessions.id = responses.session_id
            and quizzes.created_by = auth.uid()
        )
    );

-- ============================================
-- Indexes for performance
-- ============================================
create index idx_questions_quiz_id on public.questions(quiz_id);
create index idx_quiz_sessions_quiz_id on public.quiz_sessions(quiz_id);
create index idx_quiz_sessions_user_id on public.quiz_sessions(user_id);
create index idx_responses_session_id on public.responses(session_id);
create index idx_responses_question_id on public.responses(question_id);

-- ============================================
-- Functions
-- ============================================

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger set_updated_at
    before update on public.users
    for each row execute function public.handle_updated_at();

create trigger set_updated_at
    before update on public.quizzes
    for each row execute function public.handle_updated_at();

-- Function to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, name, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'role', 'student')
    );
    return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create user profile
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============================================
-- Enable realtime for live updates (optional)
-- ============================================
alter publication supabase_realtime add table public.quiz_sessions;
alter publication supabase_realtime add table public.responses;
