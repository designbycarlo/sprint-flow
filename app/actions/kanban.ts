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
