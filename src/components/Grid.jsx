import { useState, useEffect, useCallback } from 'react';
import Cell from './Cell';
import FormulaBar from './FormulaBar';
import { COLS, ROWS, makeCellId } from '../hooks/useSpreadsheet';

export default function Grid({ cells, setCell, undo, redo, canUndo, canRedo }) {
  const [selected, setSelected] = useState(null);

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    },
    [undo, redo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectedCell = selected ? cells[selected] : null;

  return (
    <div className="spreadsheet">
      <div className="toolbar">
        <button
          className="toolbar__btn"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↩ Undo
        </button>
        <button
          className="toolbar__btn"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
        >
          ↪ Redo
        </button>
      </div>

      <FormulaBar
        selectedCell={selected}
        rawValue={selectedCell ? selectedCell.raw : ''}
      />

      <div className="grid-wrapper">
        <table className="grid">
          <thead>
            <tr>
              <th className="grid__corner" />
              {COLS.map((col) => (
                <th key={col} className="grid__col-header">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row}>
                <th className="grid__row-header">{row}</th>
                {COLS.map((col) => {
                  const id = makeCellId(col, row);
                  return (
                    <Cell
                      key={id}
                      cellId={id}
                      cell={cells[id]}
                      onCommit={setCell}
                      isSelected={selected === id}
                      onSelect={setSelected}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="legend">
        <span className="legend__item legend__item--error">■</span> Error cell &nbsp;|&nbsp;
        Click a cell to edit &nbsp;|&nbsp; Enter / Tab to confirm &nbsp;|&nbsp; Esc to cancel
      </div>
    </div>
  );
}
