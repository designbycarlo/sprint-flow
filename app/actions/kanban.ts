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

  // Let Next.js know the data changed
  revalidatePath('/')
  return { success: true }
}
