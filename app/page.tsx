import { KanbanContainer } from '@/components/KanbanContainer'
import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/login/actions'
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
     return (
        <div className={styles.board} style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className={styles.column} style={{ textAlign: 'center' }}>
                <h2 className={styles.columnTitle}>Setting up your board...</h2>
                <p className={styles.cardDescription}>Please refresh in a moment. The database trigger is creating your default board.</p>
            </div>
        </div>
     )
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
        <form action={signout}>
          <button className={styles.addCardBtn} style={{ background: 'white', padding: '8px 16px' }}>Log Out</button>
        </form>
      </div>
      <KanbanContainer initialData={initialData} />
    </main>
  );
}
