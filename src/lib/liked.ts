/**
 * Bu cihazda beğenilen hikâyeler (yalnızca kişisel kolaylık; sayaç sunucuda tutulur).
 * useSyncExternalStore ile kullanılmak üzere küçük bir depo.
 */
const KEY = "pamuk:liked";
const EMPTY: ReadonlySet<number> = new Set();
const listeners = new Set<() => void>();
let cache: ReadonlySet<number> | null = null;

function read(): ReadonlySet<number> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

export function getLikedSnapshot(): ReadonlySet<number> {
  cache ??= read();
  return cache;
}

export function getLikedServerSnapshot(): ReadonlySet<number> {
  return EMPTY;
}

export function subscribeLiked(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLiked(id: number, like: boolean): void {
  const next = new Set(getLikedSnapshot());
  if (like) next.add(id);
  else next.delete(id);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify([...next].slice(-500)));
  } catch {
    // Gizli sekme vb. durumlarda yalnızca bellekte tut.
  }
  listeners.forEach((l) => l());
}
