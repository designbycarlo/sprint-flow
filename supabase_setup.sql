-- Clean up any existing broken tables so we can start fresh
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.columns CASCADE;
DROP TABLE IF EXISTS public.board_collaborators CASCADE;
DROP TABLE IF EXISTS public.boards CASCADE;

-- Create tables
CREATE TABLE public.boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.board_collaborators (
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (board_id, user_id)
);

CREATE TABLE public.columns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    position_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE public.cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    column_id UUID REFERENCES public.columns(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    position_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Helper: check if user can access a board by board_id (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.user_can_access_board_by_id(board_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = board_id
      AND (
        boards.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.board_collaborators
          WHERE board_collaborators.board_id = boards.id
            AND board_collaborators.user_id = auth.uid()
        )
      )
  );
END;
$$;

-- Create Policies for Boards
CREATE POLICY "Users can view boards they own or collaborate on" ON public.boards FOR SELECT USING (
  boards.user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.board_collaborators WHERE board_id = boards.id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their own boards" ON public.boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update boards they own or collaborate on" ON public.boards FOR UPDATE USING (
  boards.user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.board_collaborators WHERE board_id = boards.id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete only their own boards" ON public.boards FOR DELETE USING (auth.uid() = boards.user_id);

-- Policies for board_collaborators
CREATE POLICY "Board owners and collaborators can view collaborators" ON public.board_collaborators FOR SELECT USING (
  user_can_access_board_by_id(board_collaborators.board_id)
);
CREATE POLICY "Only board owner can invite collaborators" ON public.board_collaborators FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.boards WHERE boards.id = board_collaborators.board_id AND boards.user_id = auth.uid())
);
CREATE POLICY "Only board owner can remove collaborators" ON public.board_collaborators FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.boards WHERE boards.id = board_collaborators.board_id AND boards.user_id = auth.uid())
);

-- Create Policies for Columns
CREATE POLICY "Users can view columns of accessible boards" ON public.columns FOR SELECT USING (
  user_can_access_board_by_id(columns.board_id)
);
CREATE POLICY "Users can insert columns to boards they own" ON public.columns FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id AND boards.user_id = auth.uid())
);
CREATE POLICY "Users can update columns of accessible boards" ON public.columns FOR UPDATE USING (
  user_can_access_board_by_id(columns.board_id)
);
CREATE POLICY "Users can delete columns of accessible boards" ON public.columns FOR DELETE USING (
  user_can_access_board_by_id(columns.board_id)
);

-- Create Policies for Cards
CREATE POLICY "Users can view cards in accessible boards" ON public.cards FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id AND user_can_access_board_by_id(columns.board_id)
  )
);
CREATE POLICY "Users can insert cards in accessible boards" ON public.cards FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id AND user_can_access_board_by_id(columns.board_id)
  )
);
CREATE POLICY "Users can update cards in accessible boards" ON public.cards FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id AND user_can_access_board_by_id(columns.board_id)
  )
);
CREATE POLICY "Users can delete cards in accessible boards" ON public.cards FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id AND user_can_access_board_by_id(columns.board_id)
  )
);

-- Function to look up user ID by email (SECURITY DEFINER to access auth.users)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(target_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  found_id UUID;
BEGIN
  SELECT id INTO found_id FROM auth.users WHERE email = target_email;
  RETURN found_id;
END;
$$;

-- Function to get user email by ID (SECURITY DEFINER to access auth.users)
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  found_email TEXT;
BEGIN
  SELECT email INTO found_email FROM auth.users WHERE id = target_user_id;
  RETURN found_email;
END;
$$;

-- Add email columns to board_collaborators for direct access
ALTER TABLE public.board_collaborators
ADD COLUMN IF NOT EXISTS user_email TEXT;

ALTER TABLE public.board_collaborators
ADD COLUMN IF NOT EXISTS invited_by_email TEXT;

-- Function to get multiple user emails at once
CREATE OR REPLACE FUNCTION public.get_users_emails(user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY SELECT id, email FROM auth.users WHERE id = ANY(user_ids);
END;
$$;

-- Single-user lookup matching proven get_user_id_by_email pattern
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  found_email TEXT;
BEGIN
  SELECT email::TEXT INTO found_email FROM auth.users WHERE id = user_id;
  RETURN found_email;
END;
$$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    board_title TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Function to create a default board for new users automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_board_id UUID;
  col_todo_id UUID;
  col_inprogress_id UUID;
  col_done_id UUID;
BEGIN
  -- Create Board
  INSERT INTO public.boards (user_id, title) VALUES (new.id, 'My Sprint Board') RETURNING id INTO new_board_id;
  
  -- Create Columns
  INSERT INTO public.columns (board_id, title, position_index) VALUES (new_board_id, 'To Do', 0) RETURNING id INTO col_todo_id;
  INSERT INTO public.columns (board_id, title, position_index) VALUES (new_board_id, 'In Progress', 1) RETURNING id INTO col_inprogress_id;
  INSERT INTO public.columns (board_id, title, position_index) VALUES (new_board_id, 'Done', 2) RETURNING id INTO col_done_id;

  -- Create Sample Cards
  INSERT INTO public.cards (column_id, title, description, position_index) VALUES (col_todo_id, 'Design System', 'Create color palette and typography', 0);
  INSERT INTO public.cards (column_id, title, description, position_index) VALUES (col_todo_id, 'Database Schema', 'Plan out PostgreSQL tables', 1);
  INSERT INTO public.cards (column_id, title, description, position_index) VALUES (col_inprogress_id, 'Authentication', 'Implement NextAuth.js or Supabase login', 0);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
