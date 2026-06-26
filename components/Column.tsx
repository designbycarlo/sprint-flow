"use client";
import React, { ReactNode } from 'react';
import styles from './Board.module.css';
import { useDroppable } from '@dnd-kit/core';

interface ColumnProps {
  id: string;
  title: string;
  children?: ReactNode;
  onAddCard?: () => void;
}

export function Column({ id, title, children, onAddCard }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <h3 className={styles.columnTitle}>{title}</h3>
      </div>
      <div
        className={`${styles.columnBody} ${isOver ? styles.draggingOver : ''}`}
        ref={setNodeRef}
      >
        {children}
      </div>
      {onAddCard && (
        <button className={styles.addCardBtn} onClick={onAddCard}>
          + Add Card
        </button>
      )}
    </div>
  );
}