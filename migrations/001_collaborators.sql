-- Migration: Add collaboration features

-- Helper: check if user can access a board by board_id
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

-- Create board_collaborators table
CREATE TABLE IF NOT EXISTS public.board_collaborators (
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (board_id, user_id)
);

-- Enable RLS
ALTER TABLE public.board_collaborators ENABLE ROW LEVEL SECURITY;

-- Board collaborator policies
DROP POLICY IF EXISTS "Board owners and collaborators can view collaborators" ON public.board_collaborators;
CREATE POLICY "Board owners and collaborators can view collaborators" ON public.board_collaborators FOR SELECT USING (
  user_can_access_board_by_id(board_collaborators.board_id)
);
DROP POLICY IF EXISTS "Only board owner can invite collaborators" ON public.board_collaborators;
CREATE POLICY "Only board owner can invite collaborators" ON public.board_collaborators FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.boards WHERE boards.id = board_collaborators.board_id AND boards.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Only board owner can remove collaborators" ON public.board_collaborators;
CREATE POLICY "Only board owner can remove collaborators" ON public.board_collaborators FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.boards WHERE boards.id = board_collaborators.board_id AND boards.user_id = auth.uid())
);

-- Update Board Policies
DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
CREATE POLICY "Users can view boards they own or collaborate on" ON public.boards FOR SELECT USING (
  boards.user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.board_collaborators WHERE board_id = boards.id AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own boards" ON public.boards;
CREATE POLICY "Users can update boards they own or collaborate on" ON public.boards FOR UPDATE USING (
  boards.user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.board_collaborators WHERE board_id = boards.id AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own boards" ON public.boards;
CREATE POLICY "Users can delete only their own boards" ON public.boards FOR DELETE USING (auth.uid() = boards.user_id);

-- Update Column Policies
DROP POLICY IF EXISTS "Users can view columns of their boards" ON public.columns;
CREATE POLICY "Users can view columns of accessible boards" ON public.columns FOR SELECT USING (
  user_can_access_board_by_id(columns.board_id)
);

DROP POLICY IF EXISTS "Users can insert columns to their boards" ON public.columns;
CREATE POLICY "Users can insert columns to boards they own" ON public.columns FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id AND boards.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update columns of their boards" ON public.columns;
CREATE POLICY "Users can update columns of accessible boards" ON public.columns FOR UPDATE USING (
  user_can_access_board_by_id(columns.board_id)
);

DROP POLICY IF EXISTS "Users can delete columns of their boards" ON public.columns;
CREATE POLICY "Users can delete columns of accessible boards" ON public.columns FOR DELETE USING (
  user_can_access_board_by_id(columns.board_id)
);

-- Update Card Policies
DROP POLICY IF EXISTS "Users can view cards in their columns" ON public.cards;
CREATE POLICY "Users can view cards in accessible boards" ON public.cards FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id AND user_can_access_board_by_id(columns.board_id)
  )
);

DROP POLICY IF EXISTS "Users can insert cards in their columns" ON public.cards;
CREATE POLICY "Users can insert cards in accessible boards" ON public.cards FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id AND user_can_access_board_by_id(columns.board_id)
  )
);

DROP POLICY IF EXISTS "Users can update cards in their columns" ON public.cards;
CREATE POLICY "Users can update cards in accessible boards" ON public.cards FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id AND user_can_access_board_by_id(columns.board_id)
  )
);

DROP POLICY IF EXISTS "Users can delete cards in their columns" ON public.cards;
CREATE POLICY "Users can delete cards in accessible boards" ON public.cards FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.columns
    JOIN public.boards ON boards.id = columns.board_id
    WHERE columns.id = cards.column_id AND user_can_access_board_by_id(columns.board_id)
  )
);

-- Helper functions for looking up users
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
