import { useState, useRef, useEffect } from 'react';

export default function Cell({ cellId, cell, onCommit, isSelected, onSelect }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function startEdit() {
    setDraft(cell.raw);
    setEditing(true);
    onSelect(cellId);
  }

  function commit() {
    setEditing(false);
    onCommit(cellId, draft);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setEditing(false);
    }
  }

  const isError = Boolean(cell.error);
  const displayValue = editing
    ? undefined
    : cell.computed === '' || cell.computed === null || cell.computed === undefined
    ? ''
    : String(cell.computed);

  return (
    <td
      className={[
        'cell',
        isSelected && !editing ? 'cell--selected' : '',
        isError ? 'cell--error' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        onSelect(cellId);
        if (!editing) startEdit();
      }}
      title={isError ? cell.error : cell.raw}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="cell__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="cell__display">{displayValue}</span>
      )}
    </td>
  );
}
