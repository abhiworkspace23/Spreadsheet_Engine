const CELL_REF_RE = /\b([A-J](?:10|[1-9]))\b/g;

export function extractRefs(formula) {
  if (!formula.startsWith('=')) return [];
  const refs = [];
  let m;
  const re = new RegExp(CELL_REF_RE.source, 'g');
  while ((m = re.exec(formula.slice(1))) !== null) {
    refs.push(m[1].toUpperCase());
  }
  return [...new Set(refs)];
}

export function evaluateFormula(formula, getCellValue) {
  if (!formula.startsWith('=')) {
    const n = Number(formula);
    return isNaN(n) || formula.trim() === '' ? formula : n;
  }

  let expr = formula.slice(1);

  // Replace cell refs with their numeric values
  expr = expr.replace(/\b([A-J](?:10|[1-9]))\b/gi, (ref) => {
    const val = getCellValue(ref.toUpperCase());
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    const n = Number(val);
    if (isNaN(n)) throw new Error(`#VALUE: ${ref} is not a number`);
    return n;
  });

  // Only allow safe arithmetic characters
  if (!/^[\d\s+\-*/().]+$/.test(expr)) {
    throw new Error('#ERROR: invalid expression');
  }

  // eslint-disable-next-line no-new-func
  const result = Function('"use strict"; return (' + expr + ')')();
  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error('#ERROR: result is not finite');
  }
  return result;
}

/**
 * Build a topological order starting from `changedCells`.
 * Returns null if a cycle is detected among dependents.
 */
export function topoSort(startCells, dependents) {
  const visited = new Set();
  const order = [];
  const inStack = new Set();

  function dfs(cell) {
    if (inStack.has(cell)) return false; // cycle
    if (visited.has(cell)) return true;
    inStack.add(cell);
    const deps = dependents.get(cell) || new Set();
    for (const dep of deps) {
      if (!dfs(dep)) return false;
    }
    inStack.delete(cell);
    visited.add(cell);
    order.push(cell);
    return true;
  }

  for (const cell of startCells) {
    if (!dfs(cell)) return null; // cycle detected
  }

  return order;
}

/**
 * Detect if adding `cellId` -> `refs` would create a cycle.
 * Uses DFS from each ref back toward cellId via existing dependencies.
 */
export function hasCycle(cellId, refs, dependencies) {
  // deps: cell -> Set of cells it depends on
  // We need to check: can we reach cellId starting from any ref?
  const visited = new Set();

  function dfs(node) {
    if (node === cellId) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    const deps = dependencies.get(node) || new Set();
    for (const dep of deps) {
      if (dfs(dep)) return true;
    }
    return false;
  }

  for (const ref of refs) {
    if (dfs(ref)) return true;
  }
  return false;
}
