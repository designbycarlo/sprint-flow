"use client";
import React, { ReactNode } from 'react';
import styles from './Board.module.css';
import { Droppable } from '@hello-pangea/dnd';

interface ColumnProps {
  id: string;
  title: string;
  children?: ReactNode;
  onAddCard?: () => void;
}

export function Column({ id, title, children, onAddCard }: ColumnProps) {
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>{title}</h3>
          </div>
          <div
            className={`${styles.columnBody} ${snapshot.isDraggingOver ? styles.draggingOver : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {children}
            {provided.placeholder}
          </div>
          {onAddCard && (
            <button className={styles.addCardBtn} onClick={onAddCard}>
              + Add Card
            </button>
          )}
        </div>
      )}
    </Droppable>
  );
}
