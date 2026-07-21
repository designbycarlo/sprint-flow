"use client";
import React, { useState, useRef, useEffect } from 'react';
import styles from './Board.module.css';

interface ProjectMenuProps {
  onNewProjectClick: () => void;
  onShareClick: () => void;
  onDeleteProjectClick: () => void;
  boardCount: number;
  activeBoardTitle: string;
}

export function ProjectMenu({ onNewProjectClick, onShareClick, onDeleteProjectClick, boardCount, activeBoardTitle }: ProjectMenuProps) {
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

  const handleNewProject = () => {
    setIsOpen(false);
    onNewProjectClick();
  };

  const handleShare = () => {
    setIsOpen(false);
    onShareClick();
  };

  const handleDeleteProject = () => {
    setIsOpen(false);
    onDeleteProjectClick();
  };

  return (
    <div className={styles.fileMenuContainer} ref={menuRef}>
      <button
        className={styles.fileMenuBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className={styles.fileMenuGlyph} aria-hidden="true">≡</span>
        File
      </button>

      {isOpen && (
        <div className={styles.fileMenuDropdown} role="menu">
          <button
            className={styles.fileMenuItem}
            role="menuitem"
            onClick={handleNewProject}
          >
            <span className={styles.fileMenuIcon}>+</span>
            New Project
          </button>
          <button
            className={styles.fileMenuItem}
            role="menuitem"
            onClick={handleShare}
          >
            <span className={styles.fileMenuIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </span>
            Share Board
          </button>
          <div className={styles.menuSeparator}></div>
          <button
            className={`${styles.fileMenuItem} ${styles.fileMenuItemDanger}`}
            role="menuitem"
            onClick={handleDeleteProject}
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
        </div>
      )}
    </div>
  );
}
