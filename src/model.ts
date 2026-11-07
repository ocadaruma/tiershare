export const TIERS = ["S", "A", "B", "C", "D", "E", "F"] as const;
export type Tier = (typeof TIERS)[number];

export interface Item {
  id: string;
  text: string;
  link?: string;
  tier: Tier;
}

export interface Board {
  title: string;
  items: Item[];
}

export type Direction = "up" | "down" | "left" | "right";

export function emptyBoard(): Board {
  return { title: "", items: [] };
}

let seq = 0;
export function newId(): string {
  return Date.now().toString(36) + "-" + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);
}

export function tierItems(board: Board, tier: Tier): Item[] {
  return board.items.filter((i) => i.tier === tier);
}

export function addItem(board: Board, text: string, link: string | undefined, tier: Tier = "C") {
  board.items.push({ id: newId(), text, link, tier });
}

export function removeItem(board: Board, id: string) {
  board.items = board.items.filter((i) => i.id !== id);
}

/** Move an item up/down within its tier, or left/right to the adjacent tier. */
export function moveItem(board: Board, id: string, dir: Direction) {
  const idx = board.items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  const item: Item = { ...board.items[idx] };
  const items = board.items.filter((i) => i.id !== id);

  let at: number;
  if (dir === "up" || dir === "down") {
    const col = board.items.filter((i) => i.tier === item.tier);
    const pos = col.findIndex((i) => i.id === id);
    const neighbor = col[dir === "up" ? pos - 1 : pos + 1];
    if (!neighbor) return;
    const neighborIdx = items.findIndex((i) => i.id === neighbor.id);
    at = dir === "up" ? neighborIdx : neighborIdx + 1;
  } else {
    const ti = TIERS.indexOf(item.tier);
    const next = TIERS[dir === "left" ? ti - 1 : ti + 1];
    if (!next) return;
    item.tier = next;
    const col = items.filter((i) => i.tier === next);
    at = col.length ? items.indexOf(col[col.length - 1]) + 1 : items.length;
  }

  items.splice(at, 0, item);
  board.items = items;
}

/** Drag & drop: move item into `tier`, before `beforeId` (or at the tier's end if null). */
export function moveToPosition(board: Board, id: string, tier: Tier, beforeId: string | null) {
  const idx = board.items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  const item: Item = { ...board.items[idx], tier };
  const items = board.items.filter((i) => i.id !== id);

  let at: number;
  if (beforeId) {
    at = items.findIndex((i) => i.id === beforeId);
    if (at < 0) at = items.length;
  } else {
    const col = items.filter((i) => i.tier === tier);
    at = col.length ? items.indexOf(col[col.length - 1]) + 1 : items.length;
  }

  items.splice(at, 0, item);
  board.items = items;
}

/** Sanitize an object coming from the URL / localStorage. Returns null if invalid. */
export function sanitizeBoard(raw: unknown): Board | null {
  if (typeof raw !== "object" || raw === null) return null;
  const b = raw as Partial<Board>;
  if (typeof b.title !== "string") return null;
  if (!Array.isArray(b.items)) return null;

  const items: Item[] = [];
  const seen = new Set<string>();
  for (const rawItem of b.items) {
    if (typeof rawItem !== "object" || rawItem === null) continue;
    const i = rawItem as Partial<Item>;
    if (typeof i.text !== "string" || i.text.length === 0) continue;
    const tier: Tier = TIERS.includes(i.tier as Tier) ? (i.tier as Tier) : "C";
    let link: string | undefined;
    if (typeof i.link === "string" && /^https?:\/\//i.test(i.link)) link = i.link;
    let id = typeof i.id === "string" && i.id ? i.id : newId();
    while (seen.has(id)) id = newId();
    seen.add(id);
    items.push({ id, text: i.text, link, tier });
  }
  return { title: b.title, items };
}
