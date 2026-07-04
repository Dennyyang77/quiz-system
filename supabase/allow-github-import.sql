-- Allow the import script to insert/update/delete quizzes and questions
-- using the anon key when it provides the demo teacher ID as created_by.
-- This is a fallback for when SUPABASE_SERVICE_ROLE_KEY is not available.

-- Allow anon inserts for quizzes created by demo teacher
CREATE POLICY "GitHub import can create quizzes"
    ON public.quizzes FOR INSERT
    WITH CHECK (created_by = '00000000-0000-0000-0000-000000000000');

-- Allow anon updates for quizzes created by demo teacher
CREATE POLICY "GitHub import can update quizzes"
    ON public.quizzes FOR UPDATE
    USING (created_by = '00000000-0000-0000-0000-000000000000');

-- Allow anon deletes for quizzes created by demo teacher
CREATE POLICY "GitHub import can delete quizzes"
    ON public.quizzes FOR DELETE
    USING (created_by = '00000000-0000-0000-0000-000000000000');

-- Allow anon insert/delete of questions for quizzes created by demo teacher
CREATE POLICY "GitHub import can manage questions"
    ON public.questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = questions.quiz_id
            AND quizzes.created_by = '00000000-0000-0000-0000-000000000000'
        )
    );

-- Allow demo teacher user to be created by anon
CREATE POLICY "GitHub import can create demo teacher"
    ON public.users FOR INSERT
    WITH CHECK (id = '00000000-0000-0000-0000-000000000000');