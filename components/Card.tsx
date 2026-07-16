"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [isDark, setIsDark] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const longPressTimeout = useRef<number | null>(null);
  const pressTimer = useRef<number | null>(null);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description || '');
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [copied, setCopied] = useState<null | 'title' | 'desc'>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isTouchDragged = useRef<boolean>(false);
  const dragActive = useRef<boolean>(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id });

  const columnColor =
    currentColumnTitle === 'To Do' ? '#3b82f6' :
    currentColumnTitle === 'In Progress' ? '#ef4444' :
    currentColumnTitle === 'Done' ? '#22c55e' :
    undefined;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: sortableIsDragging ? 0.5 : 1,
    zIndex: sortableIsDragging ? 1000 : 'auto',
    borderLeft: columnColor ? `1px solid ${columnColor}` : undefined,
  };

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
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

  const handleCopy = async (text: string, kind: 'title' | 'desc') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      // Clipboard not available; ignore silently
    }
  };

  const handleDetailView = (e: any) => {
    if (e) e.stopPropagation();
    setShowDetailView(true);
  };

  const handleLongPress = (e: any) => {
    e.stopPropagation();
    pressTimer.current = window.setTimeout(() => {
      setShowDetailView(true);
    }, 500);
  };

  const handleTouchStart = (e: any) => {
    if (isTouchDevice) {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      dragActive.current = false;
      pressTimer.current = window.setTimeout(() => {
        setShowDetailView(true);
      }, 500);
    }
  };

  const handleTouchMove = (e: any) => {
    if (isTouchDevice) {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartX.current);
      const deltaY = Math.abs(touch.clientY - touchStartY.current);
      if (deltaX > 10 || deltaY > 10) {
        dragActive.current = true;
      }
    }
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const copyTitle = () => {
    handleCopy(title, 'title');
  };

  const copyDescription = () => {
    if (description) handleCopy(description, 'desc');
  };

  const copyPressTimer = useRef<number | null>(null);
  const copyLongPressFired = useRef(false);

  const startCopyLongPress = (text: string, kind: 'title' | 'desc') => {
    copyLongPressFired.current = false;
    if (copyPressTimer.current) clearTimeout(copyPressTimer.current);
    copyPressTimer.current = window.setTimeout(() => {
      copyLongPressFired.current = true;
    }, 500);
  };

  const endCopyLongPress = (text: string, kind: 'title' | 'desc') => {
    if (copyPressTimer.current) {
      clearTimeout(copyPressTimer.current);
      copyPressTimer.current = null;
    }
    if (copyLongPressFired.current) {
      copyLongPressFired.current = false;
      handleCopy(text, kind);
    }
  };

  const cancelCopyLongPress = () => {
    if (copyPressTimer.current) {
      clearTimeout(copyPressTimer.current);
      copyPressTimer.current = null;
    }
    copyLongPressFired.current = false;
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className={`${styles.card} ${sortableIsDragging ? styles.dragging : ''}`}>
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
                fontSize: '16px',
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
                fontSize: '16px',
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
      className={`${styles.card} ${sortableIsDragging ? styles.dragging : ''} ${!isTouchDevice ? styles.cardHoverable : ''} ${isTouchDevice ? styles.cardTouch : ''}`}
      onMouseEnter={() => {
        if (!isTouchDevice) setMenuVisible(true);
      }}
      onMouseLeave={() => {
        if (!isTouchDevice && !showMenu) setMenuVisible(false);
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: description ? 'flex-start' : 'center', minHeight: description ? 'auto' : '100%' }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <h4
            onClick={(e) => {
              e.stopPropagation();
              if (!isTouchDevice) {
                copyTitle();
              }
            }}
            title={isTouchDevice ? "Long press for details" : "Click to copy title"}
            style={{ cursor: 'pointer' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {title}
          </h4>
          {description && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <button
                type="button"
                className={styles.cardDescBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isTouchDevice) {
                    handleDetailView(e);
                  } else {
                    handleCopy(description, 'desc');
                  }
                }}
                title={description}
                aria-label={isTouchDevice ? "View description" : "Copy description"}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>
              {!isTouchDevice && (
                <p
                  className={`${styles.cardDescription} ${styles.cardDescriptionCollapsed}`}
                  style={{ margin: 0, cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(description, 'desc');
                  }}
                >
                  {description}
                </p>
              )}
            </div>
          )}
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
      {copied && (
        <span className={styles.copiedBadge}>
          {copied === 'title' ? 'Title' : 'Description'} copied
        </span>
      )}

      {showDetailView && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000,
          }}
          onClick={() => setShowDetailView(false)}
        >
          <div
            style={{
              background: isDark ? '#2d3748' : 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              maxHeight: '85vh',
              boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.2)',
              border: isDark ? '1px solid #4a5568' : 'none',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: isDark ? '#f7fafc' : '#1a202c',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <span
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  transition: 'color 0.15s',
                  color: copied === 'title' ? '#22c55e' : undefined,
                }}
                title="Long-press to copy title"
                onClick={!isTouchDevice ? copyTitle : undefined}
                onTouchStart={() => startCopyLongPress(title, 'title')}
                onTouchEnd={() => endCopyLongPress(title, 'title')}
                onTouchMove={cancelCopyLongPress}
                onTouchCancel={cancelCopyLongPress}
                onMouseDown={isTouchDevice ? () => startCopyLongPress(title, 'title') : undefined}
                onMouseUp={isTouchDevice ? () => endCopyLongPress(title, 'title') : undefined}
                onMouseLeave={isTouchDevice ? cancelCopyLongPress : undefined}
              >
                {title}
              </span>
              <button
                onClick={() => setShowDetailView(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#a0aec0',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </h3>
            {description && (
              <div style={{ overflowY: 'auto' }}>
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isDark ? '#a0aec0' : '#718096',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Description
                </h4>
                <div
                  style={{
                    border: `1px dashed ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '20px',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  }}
                >
                <p
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    lineHeight: '1.5',
                    color: copied === 'desc' ? '#22c55e' : (isDark ? '#e2e8f0' : '#2d3748'),
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    transition: 'color 0.15s',
                  }}
                  title="Long-press to copy description"
                  onClick={!isTouchDevice ? copyDescription : undefined}
                  onTouchStart={() => startCopyLongPress(description, 'desc')}
                  onTouchEnd={() => endCopyLongPress(description, 'desc')}
                  onTouchMove={cancelCopyLongPress}
                  onTouchCancel={cancelCopyLongPress}
                  onMouseDown={isTouchDevice ? () => startCopyLongPress(description, 'desc') : undefined}
                  onMouseUp={isTouchDevice ? () => endCopyLongPress(description, 'desc') : undefined}
                  onMouseLeave={isTouchDevice ? cancelCopyLongPress : undefined}
                >
                  {description}
                </p>
                </div>
              </div>
            )}
            {isTouchDevice ? (
              <p
                style={{
                  margin: '16px 0 0 0',
                  fontSize: '13px',
                  color: copied ? '#22c55e' : '#a0aec0',
                  textAlign: 'left',
                }}
              >
                {copied
                  ? `${copied === 'title' ? 'Title' : 'Description'} copied`
                  : '* Long-press the title or description to copy'}
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end',
                  marginTop: '20px',
                }}
              >
                <button
                  onClick={copyTitle}
                  style={{
                    padding: '8px 16px',
                    border: isDark ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: isDark ? '#1a202c' : 'white',
                    color: isDark ? '#e2e8f0' : '#4a5568',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Copy Title
                </button>
                {description && (
                  <button
                    onClick={copyDescription}
                    style={{
                      padding: '8px 16px',
                      border: isDark ? '1px solid #718096' : '1px solid #e2e8f0',
                      borderRadius: '6px',
                      background: isDark ? '#718096' : '#4a5568',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Copy Description
                  </button>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
