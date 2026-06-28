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
  currentColumnTitle: string;
  columns: Record<string, { id: string; title: string }>;
  onMoveCard: (cardId: string, newColumnId: string) => void;
  onEditCard?: (cardId: string, title: string, description?: string) => void;
  onDeleteCard?: (cardId: string) => void;
}

export function Card({ id, title, description, currentColumnId, currentColumnTitle, columns, onMoveCard, onEditCard, onDeleteCard }: CardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description || '');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const columnColor =
    currentColumnTitle === 'To Do' ? '#3b82f6' :
    currentColumnTitle === 'In Progress' ? '#ef4444' :
    currentColumnTitle === 'Done' ? '#22c55e' :
    undefined;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    borderLeft: columnColor ? `1px solid ${columnColor}` : undefined,
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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(title);
    setEditDescription(description || '');
    setShowDropdown(false);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (onDeleteCard && confirm('Are you sure you want to delete this card?')) {
      await onDeleteCard(id);
    }
  };

  const handleSaveEdit = () => {
    if (onEditCard && editTitle.trim()) {
      onEditCard(id, editTitle.trim(), editDescription.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(title);
    setEditDescription(description || '');
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className={`${styles.card} ${isDragging ? styles.dragging : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Title"
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #cbd5e0',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
            autoFocus
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description"
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #cbd5e0',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              minHeight: '50px',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancelEdit}
              className={styles.cancelBtn}
              style={{
                padding: '4px 10px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={!editTitle.trim()}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: '4px',
                background: editTitle.trim() ? '#4a5568' : '#a0aec0',
                color: 'white',
                cursor: editTitle.trim() ? 'pointer' : 'not-allowed',
                fontSize: '12px',
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {onEditCard && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(e);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '16px',
                lineHeight: 1,
                color: '#718096',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
              }}
              title="Edit"
            >
              ✎
            </button>
          )}
          {onDeleteCard && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(e);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '16px',
                lineHeight: 1,
                color: '#e53e3e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
              }}
              title="Delete"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: '12px', position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
          style={{
            background: showDropdown ? '#edf2f7' : 'transparent',
            border: '1px solid #cbd5e0',
            cursor: 'pointer',
            padding: '4px 10px',
            fontSize: '12px',
            color: '#718096',
            borderRadius: '4px',
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
         ❖
        </button>

        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '100%',
              marginTop: '4px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              minWidth: '140px',
              padding: '4px 0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {Object.entries(columns).map(([columnId, column]) => (
              <button
                key={columnId}
                onClick={() => handleColumnChange(columnId)}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  border: 'none',
                  background: columnId === currentColumnId ? '#edf2f7' : 'white',
                  color: columnId === currentColumnId ? '#4a5568' : '#2d3748',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: columnId === currentColumnId ? '600' : 'normal',
                }}
                onMouseOver={(e) => {
                  if (columnId !== currentColumnId) {
                    e.currentTarget.style.background = '#f7fafc';
                  }
                }}
                onMouseOut={(e) => {
                  if (columnId !== currentColumnId) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {column.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
