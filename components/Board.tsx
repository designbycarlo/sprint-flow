"use client";
import React, { ReactNode } from 'react';
import styles from './Board.module.css';

interface BoardProps {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
}

export function Board({ children, header, className }: BoardProps) {
  return (
    <div className={`${styles.boardScroll} ${className || ''}`}>
      {header}
      <div className={styles.board}>
        {children}
      </div>
    </div>
  );
}
