"use client";

import { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationRead, type Notification } from '@/app/actions/kanban';
import styles from './Board.module.css';

interface NotificationBellProps {
  onBoardClick: (boardId: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function NotificationBell({ onBoardClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function fetchNotifications() {
    const data = await getNotifications()
    setNotifications(data)
    setUnreadCount(data.filter(n => !n.read).length)
  }

  async function handleNotificationClick(n: Notification) {
    if (!n.read) {
      await markNotificationRead(n.id)
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev =>
        prev.map(p => p.id === n.id ? { ...p, read: true } : p)
      )
    }
    onBoardClick(n.board_id)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary, #718096)',
          borderRadius: '6px',
          transition: 'color 0.15s ease, background 0.15s ease',
          position: 'relative',
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary, #1a202c)'; e.currentTarget.style.background = 'rgba(0,0,0,0.05)' }}
        onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary, #718096)'; e.currentTarget.style.background = 'transparent' }}
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0px',
              right: '0px',
              background: '#e53e3e',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '15px',
              height: '15px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
              border: '1.5px solid var(--dialog-bg, #fff)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '340px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: 'var(--dialog-bg, #fff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            zIndex: 3000,
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color, #e2e8f0)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #1a202c)' }}>
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary, #718096)' }}>
              No notifications yet
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  borderBottom: '1px solid var(--border-color, #e2e8f0)',
                  background: n.read ? 'transparent' : 'rgba(66, 153, 225, 0.06)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  color: 'var(--text-primary, #1a202c)',
                  transition: 'background 0.1s ease',
                }}
                onMouseOver={(e) => { if (n.read) e.currentTarget.style.background = 'rgba(0,0,0,0.03)' }}
                onMouseOut={(e) => { if (n.read) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--text-secondary, #718096)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  {n.actor_name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div>
                    <strong>{n.actor_name}</strong> invited you to <strong>{n.board_title}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #718096)', marginTop: '2px' }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.read && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#4299e1',
                    flexShrink: 0,
                    marginTop: '6px',
                  }} />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
