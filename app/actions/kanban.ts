'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { saveLastBoard } from '@/app/login/actions'

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

export async function duplicateCard(cardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: sourceCard, error: fetchError } = await supabase
    .from('cards')
    .select('column_id, title, description, position_index')
    .eq('id', cardId)
    .single()

  if (fetchError || !sourceCard) {
    console.error("Error fetching card to duplicate", fetchError)
    throw new Error("Failed to duplicate card")
  }

  const { data: lastCard, error: countError } = await supabase
    .from('cards')
    .select('position_index')
    .eq('column_id', sourceCard.column_id)
    .order('position_index', { ascending: false })
    .limit(1)

  if (countError) {
    console.error("Error counting cards", countError)
    throw new Error("Failed to duplicate card")
  }

  const newPosition = lastCard && lastCard.length > 0 ? lastCard[0].position_index + 1 : 0

  const { data, error } = await supabase
    .from('cards')
    .insert({
      column_id: sourceCard.column_id,
      title: `${sourceCard.title} (copy)`,
      description: sourceCard.description || '',
      position_index: newPosition
    })
    .select()
    .single()

  if (error) {
    console.error("Error duplicating card", error)
    throw new Error("Failed to duplicate card")
  }

  return { success: true, card: data }
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

  await saveLastBoard(newBoard.id)

  return { success: true, board: newBoard, columns: cols }
}

export async function renameBoard(boardId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const trimmed = title.trim()
  if (!trimmed) {
    throw new Error("Board title cannot be empty")
  }

  const { error } = await supabase
    .from('boards')
    .update({ title: trimmed })
    .eq('id', boardId)
    .eq('user_id', user.id)

  if (error) {
    console.error("Error renaming board", error)
    throw new Error("Failed to rename board")
  }

  revalidatePath('/')

  await saveLastBoard(boardId)

  return { success: true }
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

// --- Collaboration ---

export async function inviteCollaborator(boardId: string, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail) throw new Error("Email is required")

  // Look up user by email via the SECURITY DEFINER function
  const { data: targetUserId, error: lookupError } = await supabase
    .rpc('get_user_id_by_email', { target_email: trimmedEmail })

  if (lookupError || !targetUserId) {
    console.error("Error looking up user", lookupError)
    throw new Error("No SprintFlow account found with this email")
  }

  if (targetUserId === user.id) {
    throw new Error("You cannot invite yourself")
  }

  // Verify the caller owns this board
  const { data: board } = await supabase
    .from('boards')
    .select('user_id')
    .eq('id', boardId)
    .single()

  if (!board || board.user_id !== user.id) {
    throw new Error("Only the board owner can invite collaborators")
  }

  const { error: insertError } = await supabase
    .from('board_collaborators')
    .insert({
      board_id: boardId,
      user_id: targetUserId,
      invited_by: user.id,
      user_email: trimmedEmail,
      invited_by_email: user.email,
    })

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error("This user is already a collaborator on this board")
    }
    console.error("Error inviting collaborator", insertError)
    throw new Error("Failed to invite collaborator")
  }

  revalidatePath('/')

  return { success: true, userId: targetUserId }
}

export async function removeCollaborator(boardId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('board_collaborators')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId)

  if (error) {
    console.error("Error removing collaborator", error)
    throw new Error("Failed to remove collaborator")
  }

  revalidatePath('/')

  return { success: true }
}

export async function getCollaborators(boardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data, error } = await supabase
    .from('board_collaborators')
    .select('user_id, invited_by, created_at, user_email, invited_by_email')
    .eq('board_id', boardId)

  if (error) {
    console.error("Error fetching collaborators", error)
    throw new Error("Failed to fetch collaborators")
  }

  if (!data || data.length === 0) return []

  const userIdsToLookup = new Set<string>()

  for (const c of data) {
    if (!c.user_email) userIdsToLookup.add(c.user_id)
    if (!c.invited_by_email && c.invited_by) userIdsToLookup.add(c.invited_by)
  }

  const emailMap: Record<string, string> = {}
  if (userIdsToLookup.size > 0) {
    const ids = [...userIdsToLookup]
    const { data: jsonData } = await supabase
      .rpc('get_users_emails_json', { user_ids: JSON.stringify(ids) })
    if (jsonData && jsonData.length > 0) {
      for (const row of jsonData) {
        emailMap[row.user_id] = row.email
      }
    } else {
      const { data: arrayData } = await supabase
        .rpc('get_users_emails', { user_ids: ids })
      if (arrayData && arrayData.length > 0) {
        for (const row of arrayData) {
          emailMap[row.user_id] = row.email
        }
      } else {
        const results = await Promise.allSettled(
          ids.map(id =>
            supabase.rpc('get_user_email_by_id', { user_id: id })
              .then(r => ({ id, email: r.data }))
          )
        )
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value.email) {
            emailMap[r.value.id] = r.value.email as unknown as string
          }
        }
      }
    }
  }

  return data.map(c => {
    const email = (c.user_email as string) || emailMap[c.user_id] || ''
    const inviterEmail = (c.invited_by_email as string) ||
      (c.invited_by === user.id && user.email ? user.email : '') ||
      emailMap[c.invited_by] ||
      ''

    return {
      userId: c.user_id,
      email: email || 'Invited user',
      invitedBy: c.invited_by,
      invitedByEmail: inviterEmail || '',
      createdAt: c.created_at,
    }
  })
}

export async function getBoardsForUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // RLS will return boards the user owns or collaborates on
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error("Error fetching boards", error)
    throw new Error("Failed to fetch boards")
  }

  // Annotate each board with ownership info
  const annotated = (data || []).map(b => ({
    id: b.id,
    title: b.title,
    created_at: b.created_at,
    is_owner: b.user_id === user.id,
    owner_id: b.user_id,
  }))

  return annotated
}
