import * as midiManager from 'midi-file';
import { useState } from 'react';

export type NoteEvent = {
  // the note number (middle c (C4) is 0)
  note: number,
  // start time in milliseconds
  startMs: number,
  // length in milliseconds
  lengthMs: number,
  // which hand should be playing the note
  hand: 0 | 1,
  // velocity to use if we play it back
  velocity: number,
}

export async function fileToNotes(file: File): Promise<readonly NoteEvent[]> {
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
            startMs: note.start / 38400,
            lengthMs: (now - note.start) / 38400,
            hand: 0,
            note: noteNumber - 60,
            velocity: note.velocity,
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

export function useNoteEvents(): [readonly NoteEvent[], (next: readonly NoteEvent[]) => void] {
  const [notes, setNotes] = useState<readonly NoteEvent[]>([]);
  return [notes, setNotes];
}

