"use client";
import React, { ReactNode } from 'react';
import styles from './Board.module.css';
import { useDroppable } from '@dnd-kit/core';

interface ColumnProps {
  id: string;
  title: string;
  children?: ReactNode;
  onAddCard?: () => void;
  isAddingCard?: boolean;
  newCardTitle?: string;
  newCardDescription?: string;
  onTitleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmitCard?: () => void;
  onCancelAddCard?: () => void;
}

export function Column({ id, title, children, onAddCard, isAddingCard, newCardTitle, newCardDescription, onTitleChange, onDescriptionChange, onSubmitCard, onCancelAddCard }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const dotColor =
    title === 'To Do' ? '#3b82f6' :
    title === 'In Progress' ? '#ef4444' :
    title === 'Done' ? '#22c55e' :
    '#6b7280';

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <h3 className={styles.columnTitle}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '3px',
              backgroundColor: dotColor,
              marginRight: '10px',
              verticalAlign: 'middle',
              flexShrink: 0,
            }}
          />
          <span style={{ verticalAlign: 'middle' }}>{title}</span>
        </h3>
      </div>
      <div
        className={`${styles.columnBody} ${isOver ? styles.draggingOver : ''}`}
        ref={setNodeRef}
      >
        {children}
        {isAddingCard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder="Card title..."
              value={newCardTitle}
              onChange={onTitleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'inherit',
              }}
              autoFocus
            />
            <textarea
              placeholder="Description (optional)..."
              value={newCardDescription}
              onChange={onDescriptionChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                fontFamily: 'inherit',
                minHeight: '60px',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={onCancelAddCard}
                className={styles.cancelBtn}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={onSubmitCard}
                disabled={!newCardTitle?.trim()}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#4a5568',
                  color: 'white',
                  cursor: newCardTitle?.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  opacity: newCardTitle?.trim() ? 1 : 0.5,
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
      {onAddCard && !isAddingCard && (
        <button className={styles.addCardBtn} onClick={onAddCard}>
          + Add Card
        </button>
      )}
    </div>
  );
}
