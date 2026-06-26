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
import styles from './Board.module.css';
import { updateCardPosition } from '@/app/actions/kanban';

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

export function KanbanContainer({ initialData }: { initialData: BoardData }) {
  const [data, setData] = useState<BoardData>(initialData);
  const [isMounted, setIsMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showToast = (message: string, type: 'error' | 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
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
    
    // Find current column
    const currentColumnId = findColumnByCardId(cardId);
    if (!currentColumnId || currentColumnId === newColumnId) return;

    // Move card to new column
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

    // Find the column containing the dragged card
    const activeColumnId = findColumnByCardId(activeId);
    if (!activeColumnId) return;

    // Check if we're dragging over a column or a card
    const overColumnId = data.columns[overId] ? overId : findColumnByCardId(overId);
    if (!overColumnId) return;

    const previousData = data;

    if (activeColumnId === overColumnId) {
      // Same column - reorder cards
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
      // Different column - move card
      const activeColumn = data.columns[activeColumnId];
      const overColumn = data.columns[overColumnId];

      const activeIndex = activeColumn.cardIds.indexOf(activeId);
      const overIndex = overColumn.cardIds.indexOf(overId);

      const newActiveCardIds = activeColumn.cardIds.filter(id => id !== activeId);
      const newOverCardIds = [...overColumn.cardIds];
      
      // Insert at the correct position
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

  if (!isMounted) {
    return null;
  }

  const activeCard = activeId ? data.cards[activeId] : null;

  return (
    <>
      <ThemeToggle />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Board className={styles.board}>
          {data.columnOrder.map((colId) => {
            const column = data.columns[colId];
            const cards = column.cardIds.map((cardId) => data.cards[cardId]);

            return (
              <Column key={column.id} id={column.id} title={column.title} onAddCard={() => console.log('Add card to', column.id)}>
                <SortableContext
                  items={column.cardIds}
                  strategy={verticalListSortingStrategy}
                >
                  {cards.map((card) => (
                    <Card
                      key={card.id}
                      id={card.id}
                      title={card.title}
                      description={card.description}
                      currentColumnId={column.id}
                      columns={data.columns}
                      onMoveCard={handleMoveCard}
                    />
                  ))}
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
    </>
  );
}