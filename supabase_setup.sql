-- Create tables
CREATE TABLE public.boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
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
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Create Policies for Boards
CREATE POLICY "Users can view their own boards" ON public.boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own boards" ON public.boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own boards" ON public.boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own boards" ON public.boards FOR DELETE USING (auth.uid() = user_id);

-- Create Policies for Columns
CREATE POLICY "Users can view columns of their boards" ON public.columns FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id AND boards.user_id = auth.uid())
);
CREATE POLICY "Users can insert columns to their boards" ON public.columns FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id AND boards.user_id = auth.uid())
);
CREATE POLICY "Users can update columns of their boards" ON public.columns FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id AND boards.user_id = auth.uid())
);
CREATE POLICY "Users can delete columns of their boards" ON public.columns FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id AND boards.user_id = auth.uid())
);

-- Create Policies for Cards
CREATE POLICY "Users can view cards in their columns" ON public.cards FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.columns
        JOIN public.boards ON boards.id = columns.board_id
        WHERE columns.id = cards.column_id AND boards.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert cards in their columns" ON public.cards FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.columns
        JOIN public.boards ON boards.id = columns.board_id
        WHERE columns.id = cards.column_id AND boards.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update cards in their columns" ON public.cards FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.columns
        JOIN public.boards ON boards.id = columns.board_id
        WHERE columns.id = cards.column_id AND boards.user_id = auth.uid()
    )
);
CREATE POLICY "Users can delete cards in their columns" ON public.cards FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.columns
        JOIN public.boards ON boards.id = columns.board_id
        WHERE columns.id = cards.column_id AND boards.user_id = auth.uid()
    )
);

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
