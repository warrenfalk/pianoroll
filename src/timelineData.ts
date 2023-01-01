import * as midiManager from 'midi-file';
import { useEffect, useState } from 'react';
import { createObservable } from './observable';

export type TimelineEvent = NoteEvent | TempoEvent | MeterEvent

export type NoteEvent = {
  type: "note",
  // the note number (middle c (C4) is 0)
  note: number,
  // the beat this note starts on
  startBeat: number,
  // the beat this note ends on
  endBeat: number,
  // which hand should be playing the note
  hand: 0 | 1,
  // velocity to use if we play it back
  velocity: number,
}

export type TempoEvent = {
  type: "tempo",
  startBeat: number,
  beatsPerMinute: number,
}

export type MeterEvent = {
  type: "meter",
  startBeat: number,
  beatsPerMeasure: number,
}

export function isNote(e: TimelineEvent): e is NoteEvent { return e.type === "note" }
export function isTempo(e: TimelineEvent): e is TempoEvent { return e.type === "tempo" }
export function isMeter(e: TimelineEvent): e is MeterEvent { return e.type === "meter" }

export function msToBeat(ms: number, bpm: number, bpmStartMs: number, bpmStartBeat: number) {
  return (((ms - bpmStartMs) / 60000) * bpm) + bpmStartBeat;
}

export function beatToMs(beat: number, bpm: number, bpmStartMs: number, bpmStartBeat: number) {
  return ((((beat - bpmStartBeat) / bpm) * 60000) + bpmStartMs);
}

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
  const output: TimelineEvent[] = [{type: "tempo", startBeat: 0, beatsPerMinute: 120}];
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
          const startBeat = msToBeat(note.start / 38.4, 120, 0, 0);
          const endBeat = msToBeat(now / 38.4, 120, 0, 0);
          output.push({
            type: "note",
            startBeat,
            endBeat,
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
  output.sort((a,b) => a.startBeat - b.startBeat);
  console.log(output);
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

