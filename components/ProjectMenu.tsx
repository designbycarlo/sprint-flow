"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createBoard } from '@/app/actions/kanban';
import styles from './Board.module.css';

interface ProjectMenuProps {
  onBoardCreated: (board: { id: string; title: string; created_at: string }) => void;
  onDeleteProject: (boardId: string) => void;
  activeBoardId: string;
  activeBoardTitle: string;
  boardCount: number;
}

export function ProjectMenu({ onBoardCreated, onDeleteProject, activeBoardId, activeBoardTitle, boardCount }: ProjectMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
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
    setShowNewProjectDialog(true);
    setNewProjectTitle('');
  };

  const handleDeleteProject = () => {
    setIsOpen(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDeleteProject(activeBoardId);
    setShowDeleteConfirm(false);
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const result = await createBoard(newProjectTitle.trim());
      if (result.success && result.board) {
        onBoardCreated(result.board);
        setShowNewProjectDialog(false);
        setNewProjectTitle('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setShowNewProjectDialog(false);
    setNewProjectTitle('');
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDeleteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmDelete();
    } else if (e.key === 'Escape') {
      handleCancelDelete();
    }
  };

  return (
    <>
      <div className={styles.fileMenuContainer} ref={menuRef}>
        <button
          className={styles.fileMenuBtn}
          onClick={() => setIsOpen(!isOpen)}
        >
          File
        </button>

        {isOpen && (
          <div className={styles.fileMenuDropdown}>
            <button
              className={styles.fileMenuItem}
              onClick={handleNewProject}
            >
              <span className={styles.fileMenuIcon}>+</span>
              New Project
            </button>
            <div className={styles.menuSeparator}></div>
            <button
              className={`${styles.fileMenuItem} ${styles.fileMenuItemDanger}`}
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

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <div className={styles.dialogOverlay} onClick={handleCancel}>
          <div className={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.dialogTitle}>New Project</h3>
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Project name"
              className={styles.dialogInput}
              autoFocus
            />
            <div className={styles.dialogActions}>
              <button
                onClick={handleCancel}
                className={styles.dialogCancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim() || isCreating}
                className={styles.dialogCreateBtn}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className={styles.dialogOverlay} onClick={handleCancelDelete}>
          <div className={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.dialogTitle}>Delete Project</h3>
            <p className={styles.dialogDescription}>
              Are you sure you want to delete <strong>"{activeBoardTitle}"</strong>?
              This will permanently remove all columns and cards in this project.
            </p>
            <div className={styles.dialogActions}>
              <button
                onClick={handleCancelDelete}
                className={styles.dialogCancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className={styles.dialogDeleteBtn}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}