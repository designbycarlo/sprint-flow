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

  // Note: We don't revalidatePath here because the client already has
  // the updated state from the optimistic update. Revalidating would
  // cause the page to re-fetch and reset the client state.
  return { success: true }
}
