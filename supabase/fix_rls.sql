-- 修正 RLS 遞迴問題（一次性執行）
-- 問題：users 表政策引用自己造成無限遞迴

-- 1. 移除 users 表所有現有政策
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Teachers can view all profiles" ON public.users;

-- 2. 重建不會遞迴的政策
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- 老師透過 quiz_sessions 關聯即可看到學生資料，不需要直接查 users 表
