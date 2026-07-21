"use client";
import React, { useState, useEffect, useCallback } from 'react';
import styles from './Board.module.css';
import { inviteCollaborator, removeCollaborator, getCollaborators } from '@/app/actions/kanban';

interface Collaborator {
  userId: string;
  email: string;
  invitedBy: string;
  invitedByEmail: string;
  createdAt: string;
}

interface ShareBoardDialogProps {
  boardId: string;
  isOwner: boolean;
  onClose: () => void;
}

export function ShareBoardDialog({ boardId, isOwner, onClose }: ShareBoardDialogProps) {
  const [email, setEmail] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCollaborators = useCallback(async () => {
    try {
      const result = await getCollaborators(boardId);
      setCollaborators(result);
    } catch {
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadCollaborators();
  }, [loadCollaborators]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      await inviteCollaborator(boardId, email.trim());
      setSuccess(`Invited ${email.trim()} as collaborator`);
      setEmail('');
      setLoading(true);
      await loadCollaborators();
    } catch {
      setError('Failed to invite collaborator');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string, email: string) => {
    if (!confirm(`Remove ${email} from this board?`)) return;
    try {
      await removeCollaborator(boardId, userId);
      setCollaborators(prev => prev.filter(c => c.userId !== userId));
    } catch {
      setError('Failed to remove collaborator');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInvite();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div
        className={styles.dialogContent}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        <h3 className={styles.dialogTitle}>Share Board</h3>

        {error && (
          <p style={{ color: '#e53e3e', fontSize: '13px', margin: '0 0 12px 0' }}>
            {error}
          </p>
        )}
        {success && (
          <p style={{ color: '#38a169', fontSize: '13px', margin: '0 0 12px 0' }}>
            {success}
          </p>
        )}

        {isOwner && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Email of SprintFlow user"
              className={styles.dialogInput}
              autoFocus
              style={{ flex: 1 }}
            />
            <button
              onClick={handleInvite}
              disabled={!email.trim() || inviting}
              className={styles.dialogCreateBtn}
              style={{ flexShrink: 0 }}
            >
              {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        )}

        <div>
          <h4
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#a0aec0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 8px 0',
            }}
          >
            Collaborators
          </h4>

          {loading ? (
            <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>Loading...</p>
          ) : collaborators.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>
              No collaborators yet
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {collaborators.map((c) => (
                <li
                  key={c.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #edf2f7',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '14px', color: '#2d3748' }}>{c.email}</span>
                    <span style={{ fontSize: '11px', color: '#a0aec0', marginLeft: '8px' }}>
                      by {c.invitedByEmail}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRemove(c.userId, c.email)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#e53e3e',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.dialogActions}>
          <button onClick={onClose} className={styles.dialogCancelBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
