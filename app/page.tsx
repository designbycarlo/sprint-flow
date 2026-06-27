import { KanbanContainer } from '@/components/KanbanContainer'
import { LogOutButton } from '@/components/LogOutButton'
import { createClient } from '@/utils/supabase/server'
import styles from '@/components/Board.module.css'

export default async function Home() {
  const supabase = await createClient()
  
  // Middleware handles the redirect to /login if no user is found, but we double check
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch boards, columns, cards
  const { data: boards } = await supabase.from('boards').select('*').eq('user_id', user.id).limit(1)
  
  let board = boards?.[0]
  if (!board) {
    // Manually create the default board and columns if the trigger failed
    const { data: newBoard, error: boardError } = await supabase.from('boards').insert({ user_id: user.id, title: 'My Sprint Board' }).select().single()
    
    if (boardError || !newBoard) {
        console.error("Failed to create board:", boardError)
        return (
            <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>
                <h2>Database Error</h2>
                <p>Failed to set up your board.</p>
                <code>{boardError?.message || "Unknown error"}</code>
            </div>
        )
    }

    board = newBoard

    // Create Columns
    const { data: cols } = await supabase.from('columns').insert([
        { board_id: board.id, title: 'To Do', position_index: 0 },
        { board_id: board.id, title: 'In Progress', position_index: 1 },
        { board_id: board.id, title: 'Done', position_index: 2 }
    ]).select()

    if (cols && cols.length === 3) {
        // Create Sample Cards
        const todoId = cols.find(c => c.title === 'To Do')?.id
        const inProgressId = cols.find(c => c.title === 'In Progress')?.id
        
        if (todoId && inProgressId) {
            await supabase.from('cards').insert([
                { column_id: todoId, title: 'Design System', description: 'Create color palette and typography', position_index: 0 },
                { column_id: todoId, title: 'Database Schema', description: 'Plan out PostgreSQL tables', position_index: 1 },
                { column_id: inProgressId, title: 'Authentication', description: 'Implement Supabase login', position_index: 0 }
            ])
        }
    }
  }

  const { data: columns } = await supabase.from('columns').select('*').eq('board_id', board.id).order('position_index', { ascending: true })
  
  // To query cards for the columns safely via RLS we can fetch them separately
  // or fetch by column IDs. For simplicity we fetch all cards that belong to this board's columns.
  const columnIds = columns?.map(c => c.id) || []
  let cards: any[] = []
  if (columnIds.length > 0) {
      const { data } = await supabase.from('cards').select('*').in('column_id', columnIds).order('position_index', { ascending: true })
      cards = data || []
  }

  // Transform into the format KanbanContainer expects
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

  const initialData = {
    columns: columnsRecord,
    cards: cardsRecord,
    columnOrder
  }

  return (
    <main>
      <div style={{ position: 'absolute', top: 16, right: 24, zIndex: 100 }}>
        <LogOutButton />
      </div>
      <KanbanContainer initialData={initialData} />
    </main>
  );
}
