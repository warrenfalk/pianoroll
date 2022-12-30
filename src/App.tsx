import { useEffect, useState } from 'react';
import './App.css'
import {NoteEvent, PianoRoll} from './PianoRoll';
import { TimeDisplay } from './TimeDisplay';

const tempo = 144;
const meter = 3; // beats per measure
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

function toAbsolute(notes: NoteEvent[]): readonly NoteEvent[] {
  const beatsPerMinute = tempo;
  const minutesPerBeat = 1 / beatsPerMinute;
  const secondsPerBeat = minutesPerBeat * 60;
  return notes.map(n => ({
    ...n,
    start: n.start * secondsPerBeat,
    length: n.length * secondsPerBeat,
  }))
}

const notes2 = toAbsolute(notes);

function App() {
  return (
    <div className="App" style={{display: 'flex', flexDirection: 'column', flexGrow: 1, placeItems: 'stretch'}}>
      <div style={{position: 'absolute'}}>
        <TimeDisplay tempo={tempo} />
      </div>
      <PianoRoll notes={notes2} keys={60} shift={-30} />
    </div>
  )
}

export default App
