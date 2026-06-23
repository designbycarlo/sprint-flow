"use client";
import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Board } from './Board';
import { Column } from './Column';
import { Card } from './Card';
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
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showToast = (message: string, type: 'error' | 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Snapshot of previous state for rollback
    const previousData = data;

    // Optimistic Update
    const startCol = data.columns[source.droppableId];
    const finishCol = data.columns[destination.droppableId];

    let newData = { ...data };

    if (startCol === finishCol) {
      const newCardIds = Array.from(startCol.cardIds);
      newCardIds.splice(source.index, 1);
      newCardIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...startCol, cardIds: newCardIds };
      newData = {
        ...data,
        columns: { ...data.columns, [newColumn.id]: newColumn },
      };
    } else {
      const startCardIds = Array.from(startCol.cardIds);
      startCardIds.splice(source.index, 1);
      const newStart = { ...startCol, cardIds: startCardIds };

      const finishCardIds = Array.from(finishCol.cardIds);
      finishCardIds.splice(destination.index, 0, draggableId);
      const newFinish = { ...finishCol, cardIds: finishCardIds };

      newData = {
        ...data,
        columns: {
          ...data.columns,
          [newStart.id]: newStart,
          [newFinish.id]: newFinish,
        },
      };
    }

    // Apply optimistic update instantly
    setData(newData);

    // Run async API (Server Action)
    try {
      await updateCardPosition(draggableId, destination.droppableId, destination.index);
    } catch (err) {
      console.error(err);
      showToast("Update failed! Rolling back...", "error");
      // Rollback UI
      setData(previousData);
    }
  };

  if (!isMounted) {
    return null; // Prevents hydration mismatch on SSR
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Board>
          {data.columnOrder.map((colId) => {
            const column = data.columns[colId];
            const cards = column.cardIds.map((cardId) => data.cards[cardId]);

            return (
              <Column key={column.id} id={column.id} title={column.title} onAddCard={() => console.log('Add card to', column.id)}>
                {cards.map((card, index) => (
                  <Card key={card.id} id={card.id} index={index} title={card.title} description={card.description} />
                ))}
              </Column>
            );
          })}
        </Board>
      </DragDropContext>
      
      {/* Toast Notification for Rollbacks */}
      {toastMessage && (
        <div className={`${styles.toast} ${styles[toastMessage.type]}`}>
          {toastMessage.message}
        </div>
      )}
    </>
  );
}
