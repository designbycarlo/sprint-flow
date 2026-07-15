"use client";
import React, { useState, useRef, useEffect } from 'react';
import styles from './Board.module.css';

interface Board {
  id: string;
  title: string;
  created_at: string;
}

interface ProjectSwitcherProps {
  boards: Board[];
  currentBoardId: string;
  onSwitchBoard: (boardId: string) => void;
}

export function ProjectSwitcher({ boards, currentBoardId, onSwitchBoard }: ProjectSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentBoard = boards.find(b => b.id === currentBoardId);

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

  return (
    <div className={styles.projectSwitcherContainer} ref={dropdownRef}>
      <button
        className={styles.projectSwitcherBtn}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.projectSwitcherTitle}>
          {currentBoard?.title || 'Select Project'}
        </span>
        <span className={`${styles.projectSwitcherArrow} ${isOpen ? styles.projectSwitcherArrowOpen : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className={styles.projectSwitcherDropdown}>
          {boards.map((board) => (
            <button
              key={board.id}
              className={`${styles.projectSwitcherItem} ${board.id === currentBoardId ? styles.projectSwitcherItemActive : ''}`}
              onClick={() => handleSelectBoard(board.id)}
            >
              <span className={styles.projectSwitcherItemTitle}>{board.title}</span>
              {board.id === currentBoardId && (
                <span className={styles.projectSwitcherCheck}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}