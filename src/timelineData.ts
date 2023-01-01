import * as midiManager from 'midi-file';
import { useEffect, useState } from 'react';
import { createObservable } from './observable';

export type TimelineEvent = NoteEvent | TempoEvent | MeterEvent

export type NoteEvent = {
  type: "note",
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

export type TempoEvent = {
  type: "tempo",
  startMs: number,
  beatsPerMinute: number,
}

export type MeterEvent = {
  type: "meter",
  startMs: number,
  beatsPerMeasure: number,
}

export function isNote(e: TimelineEvent): e is NoteEvent { return e.type === "note" }
export function isTempo(e: TimelineEvent): e is TempoEvent { return e.type === "tempo" }
export function isMeter(e: TimelineEvent): e is MeterEvent { return e.type === "meter" }

export async function fileToNotes(file: File): Promise<readonly TimelineEvent[]> {
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
  const output: TimelineEvent[] = [{type: "tempo", startMs: 0, beatsPerMinute: 120}];
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
            type: "note",
            startMs: note.start / 38.4,
            lengthMs: (now - note.start) / 38.4,
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
  output.sort((a,b) => a.startMs - b.startMs);
  console.log(parsed.tracks[0]);
  return output;
}

const timelineEventsObservable = createObservable<readonly TimelineEvent[]>([]);

export function observeTimelineEvents(observer: (timeline: readonly TimelineEvent[]) => void) {
  return timelineEventsObservable.observe(observer);
}

export function setTimelineEvents(timeline: readonly TimelineEvent[]) {
  timelineEventsObservable.set(timeline);
}

export function useTimelineEvents(): readonly TimelineEvent[] {
  const [notes, setNotes] = useState<readonly TimelineEvent[]>([]);
  useEffect(() => {
    return timelineEventsObservable.observe(next => {
      setNotes(next);
    })
  }, [])
  return notes;
}

