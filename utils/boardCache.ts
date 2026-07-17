const CACHE_PREFIX = 'board-data:';
const CACHE_VERSION = 'v1';

function cacheKey(boardId: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}:${boardId}`;
}

export function getCachedBoard(boardId: string): BoardData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(boardId));
    if (!raw) return null;
    return JSON.parse(raw) as BoardData;
  } catch {
    return null;
  }
}

export function setCachedBoard(boardId: string, data: BoardData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(cacheKey(boardId), JSON.stringify(data));
  } catch {
    // storage full or unavailable; ignore
  }
}

export function clearBoardCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // localStorage unavailable; ignore
  }
}

export function removeCachedBoard(boardId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(cacheKey(boardId));
  } catch {
    // localStorage unavailable; ignore
  }
}

type CardData = {
  id: string;
  title: string;
  description?: string;
};

type ColumnData = {
  id: string;
  title: string;
  cardIds: string[];
};

type BoardData = {
  columns: Record<string, ColumnData>;
  cards: Record<string, CardData>;
  columnOrder: string[];
};
