import { Board, Item, TIERS } from "./model";

export interface BoardCallbacks {
  onRemove(id: string): void;
}

export function renderBoard(container: HTMLElement, board: Board, cb: BoardCallbacks) {
  container.innerHTML = "";
  for (const tier of TIERS) {
    const row = document.createElement("div");
    row.className = "tier-row";
    row.dataset.tier = tier;

    const label = document.createElement("div");
    label.className = "tier-label";
    label.textContent = tier;

    const chips = document.createElement("div");
    chips.className = "chips";

    for (const item of board.items) {
      if (item.tier !== tier) continue;
      chips.appendChild(makeChip(item, cb));
    }

    row.append(label, chips);
    container.appendChild(row);
  }
}

function makeChip(item: Item, cb: BoardCallbacks): HTMLElement {
  const chip = document.createElement("div");
  chip.className = "chip";
  chip.dataset.id = item.id;
  chip.tabIndex = 0;
  chip.setAttribute("role", "listitem");
  chip.setAttribute("aria-label", item.link ? `${item.text} (link)` : item.text);

  const content = document.createElement("span");
  content.className = "chip-text";
  content.title = item.link ? item.link : item.text;
  if (item.link) {
    const a = document.createElement("a");
    a.href = item.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.text;
    content.appendChild(a);
  } else {
    content.textContent = item.text;
  }

  const x = document.createElement("button");
  x.className = "chip-x";
  x.type = "button";
  x.textContent = "✕";
  x.title = "Remove";
  x.setAttribute("aria-label", `Remove ${item.text}`);
  x.addEventListener("click", (e) => {
    e.stopPropagation();
    cb.onRemove(item.id);
  });

  chip.append(content, x);
  return chip;
}
