"use client";
import React, { useState } from 'react';

export function PasswordInput() {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'relative', marginBottom: '28px' }}>
      <label
        htmlFor="password"
        style={{
          marginBottom: '8px',
          display: 'block',
          fontSize: '0.875rem',
          color: '#4a5568',
          fontWeight: 500,
        }}
      >
        Password:
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id="password"
          name="password"
          type={show ? 'text' : 'password'}
          required
          className="login-input"
          style={{ marginBottom: 0, paddingRight: '44px' }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a0aec0',
            fontSize: '18px',
            lineHeight: 1,
          }}
        >
          {show ? (
            /* Eye-off icon (slash) */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            /* Eye-open icon */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
