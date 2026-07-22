"use client";

import { useState } from 'react';
import styles from './Board.module.css';

const avatarColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#73C6B6',
  '#E59866', '#AED6F1', '#D7BDE2', '#A3E4D7', '#FAD7A0',
];

function hashEmail(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(email: string): string {
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  return parts.map(p => p.charAt(0).toUpperCase()).filter(Boolean).slice(0, 2).join('');
}

function getDisplayName(email: string): string {
  const local = email.split('@')[0];
  return local.replace(/[._-]/g, ' ');
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function maskText(text: string): string {
  return text
    .split('')
    .map((char, i) => {
      if (i % 3 === 0 || i === text.length - 1) return char;
      return '*';
    })
    .join('');
}

interface ProfileModalProps {
  email: string;
  createdAt: string;
  onClose: () => void;
}

export function ProfileModal({ email, createdAt, onClose }: ProfileModalProps) {
  const [privacyMode, setPrivacyMode] = useState(true);
  const initials = getInitials(email);
  const bgColor = avatarColors[hashEmail(email) % avatarColors.length];
  const displayName = getDisplayName(email);

  const closeBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-secondary, #718096)',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'color 0.15s ease',
  };

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div
        className={styles.dialogContent}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '360px', padding: 0, overflow: 'hidden' }}
      >
        <div style={{ position: 'relative', padding: '24px 24px 0 24px' }}>
          <button
            onClick={onClose}
            style={closeBtnStyle}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary, #1a202c)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary, #718096)'}
            aria-label="Close"
          >
            <svg fill="none" viewBox="0 0 16 16" width="14" height="14">
              <path fill="currentColor" fillRule="evenodd" d="m9.06 8 4.97-4.97-1.06-1.06L8 6.94 3.03 1.97 1.97 3.03 6.94 8l-4.97 4.97 1.06 1.06L8 9.06l4.97 4.97 1.06-1.06z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 20px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
              color: '#fff',
              userSelect: 'none',
              marginBottom: '12px',
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary, #1a202c)',
                textTransform: 'capitalize',
              }}
            >
              {privacyMode ? maskText(displayName) : displayName}
            </h2>
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: privacyMode ? 'var(--text-secondary, #718096)' : 'var(--text-secondary, #718096)',
                borderRadius: '4px',
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary, #1a202c)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary, #718096)'}
              title={privacyMode ? 'Show username' : 'Hide username'}
              aria-label={privacyMode ? 'Show username' : 'Hide username'}
            >
              {privacyMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary, #718096)',
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {privacyMode ? maskText(email) : email}
            {privacyMode && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary, #718096)', flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            padding: '14px 24px',
            fontSize: '13px',
            color: 'var(--text-secondary, #718096)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Joined {formatDate(createdAt)}
        </div>
      </div>
    </div>
  );
}
