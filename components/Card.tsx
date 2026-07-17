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
  onDuplicateCard?: (cardId: string) => void;
}

export function Card({ id, title, description, currentColumnId, currentColumnTitle, columns, onMoveCard, onEditCard, onDeleteCard, onDuplicateCard }: CardProps) {
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

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDuplicateCard) {
      onDuplicateCard(id);
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
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: copied === 'title' ? '#22c55e' : 'inherit',
              transition: 'color 0.2s ease',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {copied === 'title' && !isTouchDevice && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
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
                style={copied === 'desc' && !isTouchDevice ? { color: '#22c55e', transition: 'color 0.2s ease' } : undefined}
              >
                {copied === 'desc' && !isTouchDevice ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.92"
                    strokeMiterlimit="10"
                    aria-hidden="true"
                  >
                    <path d="M.5 9.13h23m-23 5.75h13.42" />
                  </svg>
                )}
              </button>
              {!isTouchDevice && (
                <p
                  className={`${styles.cardDescription} ${styles.cardDescriptionCollapsed}`}
                  style={{
                    margin: 0,
                    cursor: 'pointer',
                    color: copied === 'desc' ? '#22c55e' : undefined,
                    transition: 'color 0.2s ease',
                  }}
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

              {onDuplicateCard && (
                <button
                  onClick={handleDuplicateClick}
                  className={styles.cardMenuItem}
                >
                  <span style={{ marginRight: '8px' }}>⧉</span>
                  Duplicate
                </button>
              )}

              <div className={styles.menuSeparator}></div>

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
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0, flex: 1 }}>
                <button
                  type="button"
                  onClick={copyTitle}
                  title="Copy title"
                  aria-label="Copy title"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copied === 'title' ? '#22c55e' : (isDark ? '#a0aec0' : '#718096'),
                    cursor: 'pointer',
                    padding: '2px',
                    flexShrink: 0,
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {copied === 'title' ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
                <span
                  style={{
                    minWidth: 0,
                    wordBreak: 'break-word',
                    color: copied === 'title' ? '#22c55e' : (isDark ? '#f7fafc' : '#1a202c'),
                    transition: 'color 0.2s ease',
                  }}
                >
                  {title}
                </span>
              </div>
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 0 8px 0',
                  }}
                >
                  <button
                    type="button"
                    onClick={copyDescription}
                    title="Copy description"
                    aria-label="Copy description"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copied === 'desc' ? '#22c55e' : (isDark ? '#a0aec0' : '#718096'),
                      cursor: 'pointer',
                      padding: '2px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {copied === 'desc' ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isDark ? '#a0aec0' : '#718096',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Description
                  </h4>
                </div>
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
                    transition: 'color 0.2s ease',
                  }}
                >
                  {description}
                </p>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
