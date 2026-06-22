# React Spreadsheet Engine

A browser-based spreadsheet with formula evaluation, dependency tracking, circular reference detection, and undo/redo — built entirely in React with no external formula libraries.

---

## Features

| Feature | Details |
|---|---|
| **10 × 10 grid** | Columns A–J, rows 1–10 (e.g. A1, B4, J10) |
| **Formula evaluation** | `=A1+B2`, `=A1*2`, `=(C1+D1)/3` — full arithmetic with parentheses |
| **Dependency propagation** | Changing A1 instantly recalculates every cell that (directly or indirectly) depends on it |
| **Circular reference detection** | Cells involved in a cycle display `#CIRCULAR` without crashing |
| **Error handling** | Malformed expressions show `#ERROR`; invalid references show `#REF` — other cells are unaffected |
| **Undo / Redo** | Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) with full history |
| **Formula bar** | Shows the selected cell's raw formula or value |
| **Optimised recalculation** | Only the changed cell and its dependents are recalculated (BFS traversal of the dependency graph) |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install & Run

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd excel

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # locally preview the production build
```

---

## How to Use

### Entering values

Click any cell and type a number or text, then press **Enter** or **Tab** to confirm, or **Esc** to cancel.

### Entering formulas

Start with `=` followed by an arithmetic expression. Cell references are column letter + row number (case-insensitive).

```
=A1+B2          → adds A1 and B2
=A1*2           → multiplies A1 by 2
=(C1+D1)/3      → average of C1 and D1
=A1+B1+C1-D1   → multiple references in one formula
```

### Dependency propagation

If `B1 = =A1+3` and `C1 = =B1*2`:

| You type | B1 shows | C1 shows |
|---|---|---|
| A1 = 5 | 8 | 16 |
| A1 = 10 | 13 | 26 |

Updates cascade automatically to all dependent cells.

### Circular reference

If you create a cycle (e.g. `A2 = =B2`, `B2 = =A2`), both cells display `#CIRCULAR`. The rest of the grid continues to work normally.

### Error states

| Error token | Meaning |
|---|---|
| `#CIRCULAR` | Cell is part of a circular dependency |
| `#ERROR` | Formula syntax is invalid (e.g. `=A1 +`) |
| `#REF` | A referenced cell could not be resolved |
| `#VALUE` | A referenced cell contains a non-numeric value where a number is required |

### Undo / Redo

| Action | Shortcut |
|---|---|
| Undo | Ctrl+Z (Mac: ⌘Z) |
| Redo | Ctrl+Y or Ctrl+Shift+Z (Mac: ⌘Y or ⌘⇧Z) |

Buttons in the toolbar also work.

---

## Architecture

```
src/
├── engine/
│   └── formulaEngine.js   # Pure functions: ref extraction, formula eval, cycle detection
├── hooks/
│   └── useSpreadsheet.js  # useReducer-based state: cells, dependency graph, undo/redo
├── components/
│   ├── Grid.jsx            # Table layout, keyboard shortcuts
│   ├── Cell.jsx            # Individual cell: display / edit mode
│   └── FormulaBar.jsx      # Shows raw formula of selected cell
├── App.jsx
└── App.css
```

### Dependency graph

Two maps are maintained in state:

- **`dependencies`** — `cellId → Set<cellId>` — cells *this* cell's formula reads from
- **`dependents`** — `cellId → Set<cellId>` — cells that read *this* cell

When a cell changes, `getCellsInOrder` does a BFS through `dependents` to build an ordered recalculation list so each cell is evaluated only after its dependencies are up to date.

### Circular reference detection

Before committing a new formula, `hasCycle` performs a DFS from each referenced cell through the existing `dependencies` map to see if it can reach the cell being edited. If yes, the formula is rejected and `#CIRCULAR` is displayed — no infinite loop can occur.

### Formula evaluation

The expression is processed in two steps:

1. All cell references (`A1`, `B10`, etc.) are replaced with their numeric values.
2. The resulting string is validated with a strict allowlist regex (`/^[\d\s+\-*/().]+$/`) before being passed to `Function()` — this prevents any code injection through the formula bar.

---

## Tech Stack

- [React 19](https://react.dev/) — UI and state via `useReducer`
- [Vite 8](https://vite.dev/) — build tool and dev server
- No external formula or parsing libraries

---

## Bonus Features Implemented

- [x] **Undo / Redo** — full cell-level history with keyboard shortcuts
- [x] **Optimised recalculation** — only affected cells recompute (BFS from changed cell)

---

 
