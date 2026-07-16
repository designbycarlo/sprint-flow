"use client";
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Board } from './Board';
import { Column } from './Column';
import { Card } from './Card';
import { ThemeToggle } from './ThemeToggle';
import { ProjectMenu } from './ProjectMenu';
import { ProjectSwitcher } from './ProjectSwitcher';
import { HamburgerMenu } from './HamburgerMenu';
import { SprintFlowLogo } from './SprintFlowLogo';
import { LogOutButton } from './LogOutButton';
import { WelcomeWidget } from './WelcomeWidget';
import styles from './Board.module.css';
import { updateCardPosition, addCard, deleteCard, updateCard, getBoardData, deleteBoard, createBoard, renameBoard } from '@/app/actions/kanban';

export type CardData = {
  id: string;
  title: string;
  description?: string;
};

export type ColumnData = {
  id: string;
  title: string;
  cardIds: string[];
};

export type BoardData = {
  columns: Record<string, ColumnData>;
  cards: Record<string, CardData>;
  columnOrder: string[];
};

type BoardInfo = {
  id: string;
  title: string;
  created_at: string;
};

interface KanbanContainerProps {
  initialData: BoardData;
  boards: BoardInfo[];
  currentBoardId: string;
}

export function KanbanContainer({ initialData, boards, currentBoardId: initialBoardId }: KanbanContainerProps) {
  const [data, setData] = useState<BoardData>(initialData);
  const [isMounted, setIsMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [currentBoards, setCurrentBoards] = useState<BoardInfo[]>(boards);
  const [activeBoardId, setActiveBoardId] = useState<string>(initialBoardId);
  const [isSwitching, setIsSwitching] = useState(false);

  // Lifted dialog state (shared by desktop File menu and mobile hamburger)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showToast = (message: string, type: 'error' | 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddCardClick = (columnId: string) => {
    setAddingToColumn(columnId);
    setNewCardTitle('');
    setNewCardDescription('');
  };

  const handleCancelAddCard = () => {
    setAddingToColumn(null);
    setNewCardTitle('');
    setNewCardDescription('');
  };

  const handleSubmitNewCard = async (columnId: string) => {
    if (!newCardTitle.trim()) return;

    try {
      const result = await addCard(columnId, newCardTitle.trim(), newCardDescription.trim());
      if (result.success && result.card) {
        const newCard = result.card;
        setData({
          ...data,
          columns: {
            ...data.columns,
            [columnId]: {
              ...data.columns[columnId],
              cardIds: [...data.columns[columnId].cardIds, newCard.id]
            }
          },
          cards: {
            ...data.cards,
            [newCard.id]: {
              id: newCard.id,
              title: newCard.title,
              description: newCard.description || ''
            }
          }
        });
        showToast('Card added successfully!', 'success');
        handleCancelAddCard();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to add card', 'error');
    }
  };

  const handleEditCard = async (cardId: string, title: string, description?: string) => {
    try {
      await updateCard(cardId, title, description);
      setData({
        ...data,
        cards: {
          ...data.cards,
          [cardId]: {
            ...data.cards[cardId],
            title,
            description: description || ''
          }
        }
      });
      showToast('Card updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update card', 'error');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard(cardId);
      const columnId = findColumnByCardId(cardId);
      if (columnId) {
        setData({
          ...data,
          columns: {
            ...data.columns,
            [columnId]: {
              ...data.columns[columnId],
              cardIds: data.columns[columnId].cardIds.filter(id => id !== cardId)
            }
          },
          cards: {
            ...data.cards,
            [cardId]: undefined as any
          }
        });
      }
      showToast('Card deleted successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete card', 'error');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findColumnByCardId = (cardId: string) => {
    for (const colId of data.columnOrder) {
      if (data.columns[colId].cardIds.includes(cardId)) {
        return colId;
      }
    }
    return null;
  };

  const handleMoveCard = async (cardId: string, newColumnId: string) => {
    const previousData = data;
    
    const currentColumnId = findColumnByCardId(cardId);
    if (!currentColumnId || currentColumnId === newColumnId) return;

    const currentColumn = data.columns[currentColumnId];
    const newColumn = data.columns[newColumnId];

    const newCurrentCardIds = currentColumn.cardIds.filter(id => id !== cardId);
    const newNewColumnCardIds = [...newColumn.cardIds, cardId];

    const newCurrentColumn = { ...currentColumn, cardIds: newCurrentCardIds };
    const newNewColumn = { ...newColumn, cardIds: newNewColumnCardIds };

    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [newCurrentColumn.id]: newCurrentColumn,
        [newNewColumn.id]: newNewColumn,
      },
    };

    setData(newData);

    try {
      await updateCardPosition(cardId, newColumnId, newNewColumnCardIds.length - 1);
      showToast("Card moved successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to move card. Rolling back...", "error");
      setData(previousData);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumnId = findColumnByCardId(activeId);
    if (!activeColumnId) return;

    const overColumnId = data.columns[overId] ? overId : findColumnByCardId(overId);
    if (!overColumnId) return;

    const previousData = data;

    if (activeColumnId === overColumnId) {
      const column = data.columns[activeColumnId];
      const oldIndex = column.cardIds.indexOf(activeId);
      const newIndex = column.cardIds.indexOf(overId);

      if (oldIndex === newIndex) return;

      const newCardIds = arrayMove(column.cardIds, oldIndex, newIndex);
      const newColumn = { ...column, cardIds: newCardIds };

      const newData = {
        ...data,
        columns: { ...data.columns, [newColumn.id]: newColumn },
      };

      setData(newData);

      try {
        await updateCardPosition(activeId, overColumnId, newIndex);
      } catch (err) {
        console.error(err);
        showToast("Update failed! Rolling back...", "error");
        setData(previousData);
      }
    } else {
      const activeColumn = data.columns[activeColumnId];
      const overColumn = data.columns[overColumnId];

      const activeIndex = activeColumn.cardIds.indexOf(activeId);
      const overIndex = overColumn.cardIds.indexOf(overId);

      const newActiveCardIds = activeColumn.cardIds.filter(id => id !== activeId);
      const newOverCardIds = [...overColumn.cardIds];
      
      const insertIndex = overIndex >= 0 ? overIndex : newOverCardIds.length;
      newOverCardIds.splice(insertIndex, 0, activeId);

      const newActiveColumn = { ...activeColumn, cardIds: newActiveCardIds };
      const newOverColumn = { ...overColumn, cardIds: newOverCardIds };

      const newData = {
        ...data,
        columns: {
          ...data.columns,
          [newActiveColumn.id]: newActiveColumn,
          [newOverColumn.id]: newOverColumn,
        },
      };

      setData(newData);

      try {
        await updateCardPosition(activeId, overColumnId, insertIndex);
      } catch (err) {
        console.error(err);
        showToast("Update failed! Rolling back...", "error");
        setData(previousData);
      }
    }
  };

  const handleSwitchBoard = async (boardId: string) => {
    if (boardId === activeBoardId || isSwitching) return;
    setIsSwitching(true);
    try {
      const newData = await getBoardData(boardId);
      setData(newData);
      setActiveBoardId(boardId);
      setAddingToColumn(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to load board", "error");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleBoardCreated = async (newBoard: BoardInfo) => {
    setCurrentBoards(prev => [...prev, newBoard]);
    setIsSwitching(true);
    try {
      const newData = await getBoardData(newBoard.id);
      setData(newData);
      setActiveBoardId(newBoard.id);
      setAddingToColumn(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to load new board", "error");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleDeleteProject = async (boardId: string) => {
    try {
      await deleteBoard(boardId);
      const remaining = currentBoards.filter(b => b.id !== boardId);
      if (remaining.length === 0) {
        window.location.reload();
        return;
      }
      setCurrentBoards(remaining);
      const newActive = remaining[0];
      setActiveBoardId(newActive.id);
      const newData = await getBoardData(newActive.id);
      setData(newData);
      setAddingToColumn(null);
      showToast('Project deleted', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete project', 'error');
    }
  };

  const handleOpenNewProject = () => {
    setNewProjectTitle('');
    setShowNewProjectDialog(true);
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const result = await createBoard(newProjectTitle.trim());
      if (result.success && result.board) {
        await handleBoardCreated(result.board);
        setShowNewProjectDialog(false);
        setNewProjectTitle('');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to create project', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelNewProject = () => {
    setShowNewProjectDialog(false);
    setNewProjectTitle('');
  };

  const handleNewProjectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    } else if (e.key === 'Escape') {
      handleCancelNewProject();
    }
  };

  const handleOpenDeleteProject = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    handleDeleteProject(activeBoardId);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleRenameProject = async (boardId: string, title: string) => {
    try {
      await renameBoard(boardId, title);
      setCurrentBoards(prev => prev.map(b => b.id === boardId ? { ...b, title } : b));
      showToast('Project renamed', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to rename project', 'error');
      throw err;
    }
  };

  if (!isMounted) {
    return null;
  }

  const activeCard = activeId ? data.cards[activeId] : null;
  const activeBoard = currentBoards.find(b => b.id === activeBoardId);
  const totalCards = Object.keys(data.cards).length;
  const isBoardEmpty = totalCards === 0;

  return (
    <>
      <ThemeToggle />
      
      {/* Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          zIndex: 200,
          transition: 'background 0.3s ease',
        }}
        className="app-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <SprintFlowLogo />
          <div className={styles.desktopOnly}>
            <ProjectMenu
              onNewProjectClick={handleOpenNewProject}
              onDeleteProjectClick={handleOpenDeleteProject}
              activeBoardTitle={activeBoard?.title || ''}
              boardCount={currentBoards.length}
            />
          </div>
          <ProjectSwitcher
            boards={currentBoards}
            currentBoardId={activeBoardId}
            onSwitchBoard={handleSwitchBoard}
            onRenameBoard={handleRenameProject}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className={styles.desktopOnly}>
            <LogOutButton />
          </div>
          <HamburgerMenu
            boards={currentBoards}
            currentBoardId={activeBoardId}
            onSwitchBoard={handleSwitchBoard}
            onNewProjectClick={handleOpenNewProject}
            onDeleteProjectClick={handleOpenDeleteProject}
            boardCount={currentBoards.length}
            activeBoardTitle={activeBoard?.title || ''}
          />
        </div>
      </header>

      <WelcomeWidget />

      {/* Loading overlay when switching boards */}
      {isSwitching && (
        <div className={styles.boardLoadingOverlay}>
          <div className={styles.boardLoadingSpinner} />
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Board className={styles.board}>
          {data.columnOrder.map((colId) => {
            const column = data.columns[colId];
            const cards = column.cardIds.map((cardId) => data.cards[cardId]);
            const isEmpty = column.cardIds.length === 0;

            const emptyIcons: Record<string, string> = {
              'To Do': '📋',
              'In Progress': '🚀',
              'Done': '✅',
            };

            return (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                onAddCard={() => handleAddCardClick(column.id)}
                isAddingCard={addingToColumn === column.id}
                newCardTitle={newCardTitle}
                newCardDescription={newCardDescription}
                onTitleChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCardTitle(e.target.value)}
                onDescriptionChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewCardDescription(e.target.value)}
                onSubmitCard={() => handleSubmitNewCard(column.id)}
                onCancelAddCard={handleCancelAddCard}
              >
                <SortableContext
                  items={column.cardIds}
                  strategy={verticalListSortingStrategy}
                >
                  {isEmpty && isBoardEmpty ? (
                    <div className={styles.emptyColumn}>
                      <span className={styles.emptyColumnIcon}>{emptyIcons[column.title] || '📁'}</span>
                      <p className={styles.emptyColumnTitle}>
                        {column.title === 'To Do' && 'No tasks yet'}
                        {column.title === 'In Progress' && 'Nothing in progress'}
                        {column.title === 'Done' && 'No completed tasks'}
                      </p>
                      <p className={styles.emptyColumnHint}>
                        {column.title === 'To Do'
                          ? 'Click "+ Add Card" to create your first task'
                          : 'Cards will appear here as you work on them'}
                      </p>
                    </div>
                  ) : isEmpty && !isBoardEmpty ? (
                    <div className={styles.emptyColumnCompact}>
                      <p className={styles.emptyColumnCompactText}>
                        {column.title === 'To Do' && 'No tasks'}
                        {column.title === 'In Progress' && 'No tasks in progress'}
                        {column.title === 'Done' && 'No completed tasks'}
                      </p>
                    </div>
                  ) : (
                    cards.map((card) => (
                      <Card
                        key={card.id}
                        id={card.id}
                        title={card.title}
                        description={card.description}
                        currentColumnId={column.id}
                        currentColumnTitle={column.title}
                        columns={data.columns}
                        onMoveCard={handleMoveCard}
                        onEditCard={handleEditCard}
                        onDeleteCard={handleDeleteCard}
                      />
                    ))
                  )}
                </SortableContext>
              </Column>
            );
          })}
        </Board>
        <DragOverlay>
          {activeCard ? (
            <div className={styles.card}>
              <h4 className={styles.cardTitle}>{activeCard.title}</h4>
              {activeCard.description && <p className={styles.cardDescription}>{activeCard.description}</p>}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Toast Notification for Rollbacks */}
      {toastMessage && (
        <div className={`${styles.toast} ${styles[toastMessage.type]}`}>
          {toastMessage.message}
        </div>
      )}

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <div className={styles.dialogOverlay} onClick={handleCancelNewProject}>
          <div className={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.dialogTitle}>New Project</h3>
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={handleNewProjectKeyDown}
              placeholder="Project name"
              className={styles.dialogInput}
              autoFocus
            />
            <div className={styles.dialogActions}>
              <button
                onClick={handleCancelNewProject}
                className={styles.dialogCancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim() || isCreating}
                className={styles.dialogCreateBtn}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className={styles.dialogOverlay} onClick={handleCancelDelete}>
          <div className={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.dialogTitle}>Delete Project</h3>
            <p className={styles.dialogDescription}>
              Are you sure you want to delete <strong>&quot;{activeBoard?.title}&quot;</strong>?
              This will permanently remove all columns and cards in this project.
            </p>
            <div className={styles.dialogActions}>
              <button
                onClick={handleCancelDelete}
                className={styles.dialogCancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className={styles.dialogDeleteBtn}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}