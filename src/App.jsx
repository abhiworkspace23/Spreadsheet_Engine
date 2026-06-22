import Grid from './components/Grid';
import { useSpreadsheet } from './hooks/useSpreadsheet';
import './App.css';

export default function App() {
  const { cells, setCell, undo, redo, canUndo, canRedo } = useSpreadsheet();

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">React Spreadsheet</h1>
        <p className="app__subtitle">
          Type values or formulas (e.g. <code>=A1+B2</code>) into any cell
        </p>
      </header>
      <main>
        <Grid
          cells={cells}
          setCell={setCell}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </main>
    </div>
  );
}
