"use client";
import React, { useState, useRef, useEffect } from 'react';
import styles from './Board.module.css';
import { LogOutButton } from './LogOutButton';
import { UserAvatar } from './UserAvatar';

interface Board {
  id: string;
  title: string;
  created_at: string;
}

interface HamburgerMenuProps {
  boards: Board[];
  currentBoardId: string;
  onSwitchBoard: (boardId: string) => void;
  onNewProjectClick: () => void;
  onDeleteProjectClick: () => void;
  onShareClick: () => void;
  boardCount: number;
  activeBoardTitle: string;
  userEmail?: string;
  onAvatarClick?: () => void;
}

export function HamburgerMenu({
  boards,
  currentBoardId,
  onSwitchBoard,
  onNewProjectClick,
  onDeleteProjectClick,
  onShareClick,
  boardCount,
  activeBoardTitle,
  userEmail,
  onAvatarClick,
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={styles.hamburgerContainer} ref={menuRef}>
      <button
        className={styles.hamburgerBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className={styles.hamburgerBar}></span>
        <span className={styles.hamburgerBar}></span>
        <span className={styles.hamburgerBar}></span>
      </button>

      {isOpen && (
        <div className={styles.hamburgerPanel} role="menu">
          <button
            role="menuitem"
            className={styles.hamburgerItem}
            onClick={() => {
              setIsOpen(false);
              onNewProjectClick();
            }}
          >
            <span className={styles.fileMenuIcon}>+</span>
            New Project
          </button>
          <button
            role="menuitem"
            className={`${styles.hamburgerItem} ${styles.fileMenuItemDanger}`}
            onClick={() => {
              setIsOpen(false);
              onDeleteProjectClick();
            }}
            disabled={boardCount <= 1}
            title={boardCount <= 1 ? 'Cannot delete the only project' : `Delete "${activeBoardTitle}"`}
          >
            <span className={styles.fileMenuIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
            Delete Project
          </button>

          <div className={styles.menuSeparator}></div>

          <button
            role="menuitem"
            className={styles.hamburgerItem}
            onClick={() => {
              setIsOpen(false);
              onShareClick();
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '8px', flexShrink: 0 }}>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share Board
          </button>

          <div className={styles.menuSeparator}></div>

          {userEmail && (
            <div
              className={styles.hamburgerItem}
              onClick={() => {
                onAvatarClick?.();
                setIsOpen(false);
              }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px' }}
            >
              <UserAvatar email={userEmail} />
              <span style={{ fontSize: '13px', color: 'var(--text-primary, #1a202c)', fontWeight: 500 }}>
                Profile
              </span>
            </div>
          )}

          <div className={styles.hamburgerLogout}>
            <LogOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
