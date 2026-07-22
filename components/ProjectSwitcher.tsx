"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './Board.module.css';
import { UserAvatar } from './UserAvatar';

interface Board {
  id: string;
  title: string;
  created_at: string;
  is_owner?: boolean;
  owner_id?: string;
  owner_email?: string;
}

interface ProjectSwitcherProps {
  boards: Board[];
  currentBoardId: string;
  onSwitchBoard: (boardId: string) => void;
  onRenameBoard: (boardId: string, title: string) => Promise<void>;
}

export function ProjectSwitcher({ boards, currentBoardId, onSwitchBoard, onRenameBoard }: ProjectSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentBoard = boards.find(b => b.id === currentBoardId);

  const { ownedBoards, sharedBoards } = useMemo(() => {
    const owned: Board[] = []
    const shared: Board[] = []
    for (const b of boards) {
      if (b.is_owner) owned.push(b)
      else shared.push(b)
    }
    return { ownedBoards: owned, sharedBoards: shared }
  }, [boards])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectBoard = (boardId: string) => {
    if (boardId !== currentBoardId) {
      onSwitchBoard(boardId);
    }
    setIsOpen(false);
  };

  const openRename = () => {
    setRenameValue(currentBoard?.title || '');
    setShowRenameDialog(true);
    setIsOpen(false);
  };

  const handleRename = async () => {
    if (!renameValue.trim() || isRenaming) return;

    setIsRenaming(true);
    try {
      await onRenameBoard(currentBoardId, renameValue.trim());
      setShowRenameDialog(false);
      setRenameValue('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsRenaming(false);
    }
  };

  const closeRename = () => {
    setShowRenameDialog(false);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      closeRename();
    }
  };

  function renderBoardItem(board: Board) {
    return (
      <button
        key={board.id}
        role="option"
        aria-selected={board.id === currentBoardId}
        className={`${styles.projectSwitcherItem} ${board.id === currentBoardId ? styles.projectSwitcherItemActive : ''}`}
        onClick={() => handleSelectBoard(board.id)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        {board.owner_email && !board.is_owner && (
          <UserAvatar email={board.owner_email} />
        )}
        <span className={styles.projectSwitcherItemTitle} style={{ flex: 1 }}>{board.title}</span>
        {board.id === currentBoardId && (
          <span className={styles.projectSwitcherCheck}>✓</span>
        )}
      </button>
    )
  }

  return (
    <div className={styles.projectSwitcherContainer} ref={dropdownRef}>
      <button
        className={styles.projectSwitcherBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.projectSwitcherTitle}>
          {currentBoard?.title || 'Select Project'}
        </span>
        <span className={`${styles.projectSwitcherArrow} ${isOpen ? styles.projectSwitcherArrowOpen : ''}`}>
          ▼
        </span>
      </button>

      <button
        className={styles.projectRenameBtn}
        onClick={openRename}
        title="Rename project"
        aria-label="Rename project"
        type="button"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.projectSwitcherDropdown} role="listbox">
          {ownedBoards.map(renderBoardItem)}
          {sharedBoards.length > 0 && (
            <>
              <div
                style={{
                  height: '1px',
                  background: 'var(--border-color, #e2e8f0)',
                  margin: '4px 8px',
                }}
              />
              <div
                style={{
                  padding: '4px 12px 2px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #a0aec0)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Shared with me
              </div>
              {sharedBoards.map(renderBoardItem)}
            </>
          )}
        </div>
      )}

      {showRenameDialog && (
        <div className={styles.dialogOverlay} onClick={closeRename}>
          <div className={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.dialogTitle}>Rename Project</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              placeholder="Project name"
              className={styles.dialogInput}
              autoFocus
            />
            <div className={styles.dialogActions}>
              <button
                onClick={closeRename}
                className={styles.dialogCancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={!renameValue.trim() || isRenaming}
                className={styles.dialogCreateBtn}
              >
                {isRenaming ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
