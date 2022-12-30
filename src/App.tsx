import './App.css'
import {NoteEvent, PianoRoll} from './PianoRoll';

function App() {
  const notes: NoteEvent[] = [
    {start: 0.00, length: 1.00, note:   0, hand: 0},
    {start: 1.00, length: 1.00, note:   2, hand: 0},
    {start: 2.00, length: 1.00, note:   4, hand: 0},
    {start: 3.00, length: 1.00, note:   5, hand: 0},
    {start: 4.00, length: 0.35, note:   2, hand: 0},
    {start: 4.00, length: 4.00, note: -14, hand: 1},
    {start: 4.00, length: 4.00, note: -26, hand: 1},
    {start: 4.25, length: 1.75, note:   4, hand: 0},
    {start: 6.00, length: 0.50, note:   5, hand: 0},
    {start: 6.50, length: 0.50, note:   4, hand: 0},
    {start: 7.00, length: 1.00, note:   2, hand: 0},
  ];

  return (
    <div className="App" style={{display: 'flex', flexDirection: 'column', flexGrow: 1, placeItems: 'stretch'}}>
      <PianoRoll notes={notes} keys={60} shift={-30} lead={10} past={2} />
    </div>
  )
}

export default App
