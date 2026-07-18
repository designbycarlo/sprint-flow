import Image from 'next/image';
import { PasswordInput } from '@/components/PasswordInput';
import { LoginButtons } from '@/components/LoginButtons';
import { LoginAlertHandler } from '@/components/LoginAlertHandler';

export default async function LoginPage(props: { searchParams: Promise<{ status?: string; error?: string; message?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        overflow: 'hidden',
        background: '#ffffff',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
      className="login-page"
    >
      <form className="login-form">
        {/* Logo centered above the title */}
        <div className="logo-container" style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Image
            src="/app-icon.svg"
            alt="Sprint Flow"
            width={56}
            height={56}
            priority
            style={{ display: 'inline-block' }}
          />
        </div>

        <h2
          style={{
            textAlign: 'center',
            marginBottom: '24px',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1a202c',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome to SprintFlow
        </h2>

        <LoginAlertHandler
          status={searchParams?.status}
          error={searchParams?.error}
          message={searchParams?.message}
        />

        <label
          htmlFor="email"
          style={{
            marginBottom: '6px',
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
          style={{ marginBottom: '16px' }}
        />

        <PasswordInput />

        <LoginButtons />
      </form>
    </div>
  )
}