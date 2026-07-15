"use client";
import React, { useState, useRef, useEffect } from 'react';
import styles from './Board.module.css';
import { LogOutButton } from './LogOutButton';

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
  boardCount: number;
  activeBoardTitle: string;
}

export function HamburgerMenu({
  boards,
  currentBoardId,
  onSwitchBoard,
  onNewProjectClick,
  onDeleteProjectClick,
  boardCount,
  activeBoardTitle,
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
          <div className={styles.hamburgerSectionLabel}>Switch Project</div>
          {boards.map((board) => (
            <button
              key={board.id}
              role="menuitem"
              className={`${styles.hamburgerItem} ${board.id === currentBoardId ? styles.hamburgerItemActive : ''}`}
              onClick={() => {
                onSwitchBoard(board.id);
                setIsOpen(false);
              }}
            >
              <span className={styles.hamburgerItemTitle}>{board.title}</span>
              {board.id === currentBoardId && (
                <span className={styles.projectSwitcherCheck}>✓</span>
              )}
            </button>
          ))}

          <div className={styles.menuSeparator}></div>

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
            <span className={styles.fileMenuIcon}>🗑</span>
            Delete Project
          </button>

          <div className={styles.menuSeparator}></div>

          <div className={styles.hamburgerLogout}>
            <LogOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
