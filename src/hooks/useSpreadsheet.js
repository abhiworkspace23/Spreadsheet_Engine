import { useReducer, useCallback } from 'react';
import { extractRefs, evaluateFormula, hasCycle } from '../engine/formulaEngine';

const COLS = 'ABCDEFGHIJ'.split('');
const ROWS = Array.from({ length: 10 }, (_, i) => i + 1);

function makeCellId(col, row) {
  return `${col}${row}`;
}

function initCells() {
  const cells = {};
  for (const col of COLS) {
    for (const row of ROWS) {
      const id = makeCellId(col, row);
      cells[id] = { raw: '', computed: '', error: null };
    }
  }
  return cells;
}

function initState() {
  return {
    cells: initCells(),
    // dependencies[cell] = Set of cells this cell depends on (its formula refs)
    dependencies: new Map(),
    // dependents[cell] = Set of cells that depend on this cell
    dependents: new Map(),
    history: [],
    future: [],
  };
}

function getCellsInOrder(changedCell, dependents) {
  // BFS to get all cells that need recalculating, in dependency order
  const order = [];
  const visited = new Set();
  const queue = [changedCell];

  while (queue.length) {
    const cell = queue.shift();
    if (visited.has(cell)) continue;
    visited.add(cell);
    order.push(cell);
    const deps = dependents.get(cell) || new Set();
    for (const dep of deps) {
      if (!visited.has(dep)) queue.push(dep);
    }
  }

  return order; // first element is the changed cell itself
}

function recalculate(cells, dependencies, dependents, startCell) {
  const order = getCellsInOrder(startCell, dependents);
  const newCells = { ...cells };

  for (const cellId of order) {
    const raw = newCells[cellId].raw;
    if (!raw.startsWith('=')) {
      const n = raw.trim() === '' ? '' : isNaN(Number(raw)) ? raw : Number(raw);
      newCells[cellId] = { raw, computed: n, error: null };
      continue;
    }

    try {
      const computed = evaluateFormula(raw, (ref) => {
        const refCell = newCells[ref];
        if (!refCell) throw new Error(`#REF: ${ref} not found`);
        if (refCell.error) throw new Error(refCell.error);
        return refCell.computed;
      });
      newCells[cellId] = { raw, computed, error: null };
    } catch (e) {
      newCells[cellId] = { raw, computed: e.message, error: e.message };
    }
  }

  return newCells;
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CELL': {
      const { cellId, raw } = action;
      const prevRaw = state.cells[cellId].raw;
      if (prevRaw === raw) return state;

      const newDependencies = new Map(state.dependencies);
      const newDependents = new Map(state.dependents);

      // Remove old dependency edges for this cell
      const oldRefs = newDependencies.get(cellId) || new Set();
      for (const ref of oldRefs) {
        const refDeps = new Set(newDependents.get(ref) || []);
        refDeps.delete(cellId);
        newDependents.set(ref, refDeps);
      }

      // Compute new refs
      const newRefs = new Set(raw.startsWith('=') ? extractRefs(raw) : []);

      // Check for circular reference
      if (hasCycle(cellId, newRefs, newDependencies)) {
        const newCells = {
          ...state.cells,
          [cellId]: { raw, computed: '#CIRCULAR', error: '#CIRCULAR' },
        };
        return {
          ...state,
          cells: newCells,
          history: [...state.history, { cellId, raw: prevRaw }],
          future: [],
        };
      }

      // Add new dependency edges
      newDependencies.set(cellId, newRefs);
      for (const ref of newRefs) {
        const refDeps = new Set(newDependents.get(ref) || []);
        refDeps.add(cellId);
        newDependents.set(ref, refDeps);
      }

      const newCells = recalculate(
        { ...state.cells, [cellId]: { ...state.cells[cellId], raw } },
        newDependencies,
        newDependents,
        cellId
      );

      return {
        ...state,
        cells: newCells,
        dependencies: newDependencies,
        dependents: newDependents,
        history: [...state.history, { cellId, raw: prevRaw }],
        future: [],
      };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const history = [...state.history];
      const last = history.pop();
      // Re-apply previous raw, and push current to future
      const currentRaw = state.cells[last.cellId].raw;

      // We dispatch a SET_CELL internally by re-running the reducer logic
      // Simpler: recurse with SET_CELL and restore future manually
      const intermediate = reducer(
        { ...state, history, future: state.future },
        { type: 'SET_CELL', cellId: last.cellId, raw: last.raw }
      );
      return {
        ...intermediate,
        history,
        future: [{ cellId: last.cellId, raw: currentRaw }, ...state.future],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const future = [...state.future];
      const next = future.shift();
      const currentRaw = state.cells[next.cellId].raw;

      const intermediate = reducer(
        { ...state, history: state.history, future },
        { type: 'SET_CELL', cellId: next.cellId, raw: next.raw }
      );
      return {
        ...intermediate,
        future,
        history: [...intermediate.history.slice(0, -1), { cellId: next.cellId, raw: currentRaw }],
      };
    }

    default:
      return state;
  }
}

export function useSpreadsheet() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  const setCell = useCallback((cellId, raw) => {
    dispatch({ type: 'SET_CELL', cellId, raw });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  return {
    cells: state.cells,
    setCell,
    undo,
    redo,
    canUndo: state.history.length > 0,
    canRedo: state.future.length > 0,
  };
}

export { COLS, ROWS, makeCellId };
