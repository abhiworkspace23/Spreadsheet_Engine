export default function FormulaBar({ selectedCell, rawValue }) {
  return (
    <div className="formula-bar">
      <span className="formula-bar__cell-id">{selectedCell || ''}</span>
      <div className="formula-bar__value">
        {rawValue || ''}
      </div>
    </div>
  );
}
