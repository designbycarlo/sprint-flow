import { login, signup } from './actions'
import styles from '@/components/Board.module.css';

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div className={styles.board} style={{ justifyContent: 'center', alignItems: 'center' }}>
      <form className={styles.column} style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className={styles.columnTitle} style={{ textAlign: 'center', marginBottom: '24px', fontSize: '1.5rem' }}>Welcome to Sprint Flow</h2>
        
        {searchParams?.error && (
            <div style={{ color: '#e53e3e', marginBottom: '16px', textAlign: 'center', fontSize: '0.875rem' }}>
                {searchParams.error}
            </div>
        )}

        <label htmlFor="email" className={styles.cardDescription} style={{ marginBottom: '8px', display: 'block' }}>Email:</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required 
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '16px' }}
        />
        
        <label htmlFor="password" className={styles.cardDescription} style={{ marginBottom: '8px', display: 'block' }}>Password:</label>
        <input 
          id="password" 
          name="password" 
          type="password" 
          required 
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '24px' }}
        />
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button formAction={login} className={styles.addCardBtn} style={{ flex: 1 }}>Log In</button>
          <button formAction={signup} className={styles.addCardBtn} style={{ flex: 1, background: '#1a202c', color: 'white', borderColor: '#1a202c' }}>Sign Up</button>
        </div>
      </form>
    </div>
  )
}
