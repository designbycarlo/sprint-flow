import { login, signup } from './actions'
import Image from 'next/image';
import { PasswordInput } from '@/components/PasswordInput';
import { ThemeToggle } from '@/components/ThemeToggle';

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f1419 0%, #1a202c 50%, #2d3748 100%)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <form className="login-form">
        {/* Logo centered above the title */}
        <div className="logo-container" style={{ textAlign: 'center', marginBottom: '20px', color: '#1a202c' }}>
          <Image
            src="/sprint-flow-logo.svg"
            alt="Sprint Flow"
            width={180}
            height={69}
            priority
            style={{ display: 'inline-block', color: 'inherit' }}
          />
        </div>

        <h2
          style={{
            textAlign: 'center',
            marginBottom: '28px',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#1a202c',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome to Sprint Flow
        </h2>

        {searchParams?.error && (
          <div
            style={{
              color: '#e53e3e',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '0.875rem',
              background: 'rgba(229, 62, 62, 0.05)',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(229, 62, 62, 0.15)',
            }}
          >
            {searchParams.error}
          </div>
        )}

        <label
          htmlFor="email"
          style={{
            marginBottom: '8px',
            display: 'block',
            fontSize: '0.875rem',
            color: '#4a5568',
            fontWeight: 500,
          }}
        >
          Email:
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="login-input"
          style={{ marginBottom: '18px' }}
        />

        <PasswordInput />

        <div style={{ display: 'flex', gap: '12px' }}>
          <button formAction={login} className="login-btn-primary">
            Log In
          </button>
          <button formAction={signup} className="login-btn-secondary">
            Sign Up
          </button>
        </div>
      </form>
      <ThemeToggle />
    </div>
  )
}
