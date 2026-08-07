-- Supabase Auth Migration: Add user_id column and secure RLS policies
-- Run this in Supabase SQL Editor AFTER the initial migration

-- 1. Add user_id column linked to Supabase Auth
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Set default so new inserts auto-assign the authenticated user
ALTER TABLE tasks ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3. Drop the old permissive policy
DROP POLICY IF EXISTS "Allow all access" ON tasks;

-- 4. Create per-user RLS policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Index on user_id for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
