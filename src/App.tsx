import './App.css'
import {NoteEvent, PianoRoll} from './PianoRoll';
import { Controls } from './Controls';
import * as midiManager from 'midi-file';
import { useState } from 'react';
import { midi } from './midi';



async function fileToNotes(file: File): Promise<readonly NoteEvent[]> {
  type NoteStartInfo = {
    start: number,
    velocity: number,
  }
  const data = await file.arrayBuffer();
  const array = new Uint8Array(data);
  const parsed = midiManager.parseMidi(array);
  if (parsed.tracks.length < 1) {
    throw new Error("No tracks");
  }
  const track = parsed.tracks[0];
  const output: NoteEvent[] = [];
  let now = 0;
  const notesOn = new Map<string, NoteStartInfo>();
  // to process a list of midi events, you have to loop through it and keep track of certain state
  for (const event of track) {
    now += event.deltaTime;
    switch (event.type) {
      case "noteOn": {
        const {noteNumber, channel, velocity} = event;
        const id = `${channel}.${noteNumber}`;
        notesOn.set(id, {start: now, velocity});
        break;
      }
      case "noteOff": {
        const {noteNumber, channel} = event;
        const id = `${channel}.${noteNumber}`;
        const note = notesOn.get(id);
        // 19200 per quarter note = 1 beat 120 beats per minute 1/120 minutes per beat = 0.5 seconds per beat per 19200 units per beat 
        // 38400 per second
        if (note) {
          output.push({
            start: note.start / 38400,
            length: (now - note.start) / 38400,
            hand: 0,
            note: noteNumber - 60,
          });
          notesOn.delete(id);
        }
        break;
      }
    }
  }
  console.log(parsed.tracks[0]);
  return output;
}

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
  const [notes, setNotes] = useState<readonly NoteEvent[]>(notes2);

  return (
    <div
      className="App"
      style={{display: 'flex', flexDirection: 'column', flexGrow: 1, placeItems: 'stretch'}}
      onClick={() => {
        midi().then(() => {}).catch(e => console.error(e));
      }}
      onDrop={(e) => {
        if (e.dataTransfer.items.length > 0 && e.dataTransfer.items[0].type === 'audio/midi') {
          const file = e.dataTransfer.items[0].getAsFile();
          if (file === null) {
            console.error("No file");
            return;
          }
          fileToNotes(file)
            .then(notes => setNotes(notes))
            .catch(e => console.error(e));
          
          console.log(file);
        }
        e.preventDefault();
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}>
      <div style={{position: 'absolute'}}>
        <Controls tempo={tempo} />
      </div>
      <PianoRoll notes={notes} keys={88} shift={-39} />
    </div>
  )
}

export default App
