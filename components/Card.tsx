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
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description || '');
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuVisible, setMenuVisible] = useState(false);

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

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleColumnChange = (newColumnId: string) => {
    if (newColumnId !== currentColumnId) {
      onMoveCard(id, newColumnId);
    }
    setShowMenu(false);
    setShowMoveSubmenu(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(title);
    setEditDescription(description || '');
    setShowMenu(false);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
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
      className={`${styles.card} ${isDragging ? styles.dragging : ''} ${!isTouchDevice ? styles.cardHoverable : ''}`}
      onMouseEnter={() => {
        if (!isTouchDevice) setMenuVisible(true);
      }}
      onMouseLeave={() => {
        if (!isTouchDevice && !showMenu) setMenuVisible(false);
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 className={styles.cardTitle}>{title}</h4>
          {description && <p className={styles.cardDescription}>{description}</p>}
        </div>
        {/* 3-dot vertical menu trigger - always visible on touch, visible on hover for desktop */}
        <div
          className={`
            ${styles.cardMenuContainer}
            ${(isTouchDevice || menuVisible) ? styles.cardMenuVisible : ''}
          `}
          ref={menuRef}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={styles.cardMenuBtn}
            style={{
              background: showMenu ? '#edf2f7' : 'transparent',
            }}
            title="Card actions"
          >
            <span className={styles.threeDots}>⋮</span>
          </button>

          {showMenu && (
            <div
              className={styles.cardMenuDropdown}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Move To submenu */}
              <div
                className={styles.moveToSubmenu}
                onMouseEnter={() => {
                  if (!isTouchDevice) setShowMoveSubmenu(true);
                }}
                onMouseLeave={() => {
                  if (!isTouchDevice) setShowMoveSubmenu(false);
                }}
                onClick={(e) => {
                  if (isTouchDevice) {
                    e.stopPropagation();
                    setShowMoveSubmenu(!showMoveSubmenu);
                  }
                }}
              >
                <button className={`${styles.cardMenuItem} ${styles.moveToTrigger}`}>
                  <span className={styles.arrowIcon}>›</span>
                  <span>Move To</span>
                </button>
                
                {showMoveSubmenu && (
                  <div className={styles.moveToDropdown}>
                    {Object.entries(columns).map(([columnId, column]) => (
                      <button
                        key={columnId}
                        onClick={() => handleColumnChange(columnId)}
                        className={`${styles.moveToItem} ${columnId === currentColumnId ? styles.moveToItemActive : ''}`}
                      >
                        {column.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.menuSeparator}></div>

              {onEditCard && (
                <button
                  onClick={handleEditClick}
                  className={styles.cardMenuItem}
                >
                  <span style={{ marginRight: '8px' }}>✎</span>
                  Edit
                </button>
              )}
              
              {onDeleteCard && (
                <button
                  onClick={handleDeleteClick}
                  className={styles.cardMenuItem}
                  style={{ color: '#e53e3e' }}
                >
                  <span style={{ marginRight: '8px' }}>✕</span>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
