'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCardPosition(cardId: string, newColumnId: string, newIndex: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('cards')
    .update({ column_id: newColumnId, position_index: newIndex })
    .eq('id', cardId)

  if (error) {
    console.error("Error updating card", error)
    throw new Error("Failed to update card position in Supabase")
  }

  return { success: true }
}

export async function addCard(columnId: string, title: string, description?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: existingCards, error: countError } = await supabase
    .from('cards')
    .select('position_index')
    .eq('column_id', columnId)
    .order('position_index', { ascending: false })
    .limit(1)

  if (countError) {
    console.error("Error counting cards", countError)
    throw new Error("Failed to add card")
  }

  const newPosition = existingCards && existingCards.length > 0 ? existingCards[0].position_index + 1 : 0

  const { data, error } = await supabase
    .from('cards')
    .insert({
      column_id: columnId,
      title,
      description: description || '',
      position_index: newPosition
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding card", error)
    throw new Error("Failed to add card")
  }

  return { success: true, card: data }
}

export async function deleteCard(cardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId)

  if (error) {
    console.error("Error deleting card", error)
    throw new Error("Failed to delete card")
  }

  return { success: true }
}

export async function updateCard(cardId: string, title: string, description?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('cards')
    .update({ 
      title: title.trim(),
      description: (description || '').trim()
    })
    .eq('id', cardId)

  if (error) {
    console.error("Error updating card", error)
    throw new Error("Failed to update card")
  }

  return { success: true }
}

export async function getBoardData(boardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: columns } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position_index', { ascending: true })

  const columnIds = columns?.map(c => c.id) || []
  let cards: any[] = []
  if (columnIds.length > 0) {
    const { data } = await supabase
      .from('cards')
      .select('*')
      .in('column_id', columnIds)
      .order('position_index', { ascending: true })
    cards = data || []
  }

  const columnsRecord: Record<string, any> = {}
  const columnOrder: string[] = []

  columns?.forEach(col => {
    columnsRecord[col.id] = { id: col.id, title: col.title, cardIds: [] }
    columnOrder.push(col.id)
  })

  const cardsRecord: Record<string, any> = {}

  cards?.forEach(card => {
    cardsRecord[card.id] = { id: card.id, title: card.title, description: card.description || '' }
    if (columnsRecord[card.column_id]) {
      columnsRecord[card.column_id].cardIds.push(card.id)
    }
  })

  return {
    columns: columnsRecord,
    cards: cardsRecord,
    columnOrder
  }
}

export async function getBoards() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error("Error fetching boards", error)
    throw new Error("Failed to fetch boards")
  }

  return data || []
}

export async function createBoard(title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: newBoard, error: boardError } = await supabase
    .from('boards')
    .insert({ user_id: user.id, title: title.trim() })
    .select()
    .single()

  if (boardError || !newBoard) {
    console.error("Error creating board", boardError)
    throw new Error("Failed to create board")
  }

  const { data: cols } = await supabase.from('columns').insert([
    { board_id: newBoard.id, title: 'To Do', position_index: 0 },
    { board_id: newBoard.id, title: 'In Progress', position_index: 1 },
    { board_id: newBoard.id, title: 'Done', position_index: 2 }
  ]).select()

  return { success: true, board: newBoard, columns: cols }
}

export async function deleteBoard(boardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId)
    .eq('user_id', user.id)

  if (error) {
    console.error("Error deleting board", error)
    throw new Error("Failed to delete board")
  }

  return { success: true }
}
