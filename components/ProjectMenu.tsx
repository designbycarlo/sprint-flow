"use client";
import React, { useState, useRef, useEffect } from 'react';
import styles from './Board.module.css';

interface ProjectMenuProps {
  onNewProjectClick: () => void;
  onDeleteProjectClick: () => void;
  boardCount: number;
  activeBoardTitle: string;
}

export function ProjectMenu({ onNewProjectClick, onDeleteProjectClick, boardCount, activeBoardTitle }: ProjectMenuProps) {
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
          <div className={styles.menuSeparator}></div>
          <button
            className={`${styles.fileMenuItem} ${styles.fileMenuItemDanger}`}
            role="menuitem"
            onClick={handleDeleteProject}
            disabled={boardCount <= 1}
            title={boardCount <= 1 ? 'Cannot delete the only project' : `Delete "${activeBoardTitle}"`}
          >
            <span className={styles.fileMenuIcon}>🗑</span>
            Delete Project
          </button>
        </div>
      )}
    </div>
  );
}
