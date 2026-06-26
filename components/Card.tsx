"use client";
import React, { useState, useRef, useEffect } from 'react';
import styles from './Board.module.css';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CardProps {
  id: string;
  title: string;
  description?: string;
  currentColumnId: string;
  columns: Record<string, { id: string; title: string }>;
  onMoveCard: (cardId: string, newColumnId: string) => void;
}

export function Card({ id, title, description, currentColumnId, columns, onMoveCard }: CardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleColumnChange = (newColumnId: string) => {
    if (newColumnId !== currentColumnId) {
      onMoveCard(id, newColumnId);
    }
    setShowDropdown(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 className={styles.cardTitle}>{title}</h4>
          {description && <p className={styles.cardDescription}>{description}</p>}
        </div>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            style={{
              background: showDropdown ? '#e2e8f0' : 'transparent',
              border: '1px solid #cbd5e0',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '16px',
              color: '#4a5568',
              borderRadius: '6px',
              fontWeight: 'bold',
              lineHeight: 1,
              minWidth: '28px',
              minHeight: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              if (!showDropdown) {
                e.currentTarget.style.background = '#edf2f7';
                e.currentTarget.style.borderColor = '#a0aec0';
              }
            }}
            onMouseOut={(e) => {
              if (!showDropdown) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#cbd5e0';
              }
            }}
            title="Move to column"
          >
            ⋮
          </button>
          
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '4px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '150px',
                padding: '4px 0',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {Object.values(columns).map((column) => (
                <button
                  key={column.id}
                  onClick={() => handleColumnChange(column.id)}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: column.id === currentColumnId ? '#edf2f7' : 'white',
                    color: '#2d3748',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: column.id === currentColumnId ? '600' : '400',
                  }}
                  onMouseOver={(e) => {
                    if (column.id !== currentColumnId) {
                      e.currentTarget.style.background = '#f7fafc';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (column.id !== currentColumnId) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  {column.title}
                  {column.id === currentColumnId && ' ✓'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}