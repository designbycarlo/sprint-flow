"use client";
import React, { ReactNode } from 'react';
import styles from './Board.module.css';

interface BoardProps {
  children: ReactNode;
  className?: string;
}

export function Board({ children, className }: BoardProps) {
  return (
    <div className={`${styles.board} ${className || ''}`}>
      {children}
    </div>
  );
}
