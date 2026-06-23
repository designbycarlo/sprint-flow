"use client";
import React from 'react';
import styles from './Board.module.css';
import { Draggable } from '@hello-pangea/dnd';

interface CardProps {
  id: string;
  index: number;
  title: string;
  description?: string;
}

export function Card({ id, index, title, description }: CardProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${styles.card} ${snapshot.isDragging ? styles.dragging : ''}`}
          style={{ ...provided.draggableProps.style }}
        >
          <h4 className={styles.cardTitle}>{title}</h4>
          {description && <p className={styles.cardDescription}>{description}</p>}
        </div>
      )}
    </Draggable>
  );
}
