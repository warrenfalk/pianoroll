import { useEffect, useRef } from "react";
import { subscribePlaybackTime } from "./playbackTime";

//export function iter<T>(i: Iterable<T>): 

export function* range(start: number, length: number) {
  for (let i = 0; i < length; i++) {
    yield start + i;
  }
}

export function noteColor(note: number) {
  const n = ((note % 12) + 12) % 12;
  return ((n < 5 ? n : n + 1) % 2) ? "black" : "white";
}

export type NoteEvent = {
  note: number,
  start: number,
  length: number,
  hand: 0 | 1,
}

type NoteEventsProps = {
  notes: readonly NoteEvent[],
}
function NoteEvents({notes}: NoteEventsProps) {
  return (
    <g
      id="notes">
      <defs>
        <linearGradient
          id="hand0">
          <stop
            style={{stopColor:'#9000FF',stopOpacity:0.7}}
            offset="0" />
          <stop
            style={{stopColor:'#9000FF',stopOpacity:0.7}}
            offset="1" />
        </linearGradient>
        <linearGradient
          id="hand1">
          <stop
            style={{stopColor:'#009900',stopOpacity:0.7}}
            offset="0" />
          <stop
            style={{stopColor:'#009900',stopOpacity:0.7}}
            offset="1" />
        </linearGradient>
        <linearGradient
          id="hand2">
          <stop
            style={{stopColor:'#9000FF',stopOpacity:0.7}}
            offset="0" />
          <stop
            style={{stopColor:'#9000FF',stopOpacity:0.7}}
            offset="1" />
        </linearGradient>
      </defs>
      {notes.map(({note, length, start, hand}) => (
        <rect
          key={`${start}-${note}`}
          style={{fill: `url(#hand${hand})`}}
          //style="color:#000000;overflow:visible;fill:#0167f9;stroke-width:3.02362;stroke-linejoin:round"
          width="1"
          height={length}
          x={note}
          y={-(start + length)}
          rx={0.3}
          ry={0.03}
        />
      ))}
    </g>
  )
}

type BackgroundGridProps = {
  // how many piano keys to show
  keys: number,
  // shift by how many keys
  shift: number,
}
function BackgroundGrid({keys, shift}: BackgroundGridProps) {
  return (
    <g id="grid">
      <defs>
        <linearGradient
          id="black">
          <stop
            style={{stopColor:'#d2d2d2',stopOpacity:1}}
            offset="0" />
          <stop
            style={{stopColor:'#d2d2d2',stopOpacity:1}}
            offset="1" />
        </linearGradient>
        <linearGradient
          id="white">
          <stop
            style={{stopColor:'#f5f5f5',stopOpacity:1}}
            offset="0" />
          <stop
            style={{stopColor:'#ffffff',stopOpacity:1}}
            offset="1" />
        </linearGradient>
      </defs>
      {[...range(shift, keys)].map(n => (
        <rect
          key={n}
          style={{fill: noteColor(n) === "white" ? "url(#white)" : "url(#black)"}}
          //style="color:#000000;overflow:visible;fill:#0167f9;stroke-width:3.02362;stroke-linejoin:round"
          width="1"
          height="100%"
          x={n - shift}
          y={0}
        />
      ))}
    </g>
  )
}

function PastOverlay() {
  return (
    <g>
      <rect
        style={{fill: 'black', opacity: '0.1'}}
        x={0}
        y={0}
        width={1}
        height={1}
      />
    </g>
  )
}

type PianoRollProps = {
  notes?: readonly NoteEvent[],
  // how many piano keys to show
  keys?: number,
  // shift by how many keys
  shift?: number,
  // how many seconds of the future to show
  lead?: number,
  // how many seconds of the past to show
  past?: number,
}
export function PianoRoll({notes = [], keys = 88, lead = 2.75, past = 0.75, shift = -39}: PianoRollProps) {
  const gRef = useRef<SVGGraphicsElement>(null);
  useEffect(() => {
    const unsub = subscribePlaybackTime(time => {
      const g = gRef.current;
      if (g)
        g.style.transform = `translate(${-shift}px, ${time / 1000}px)`;
    });
    return unsub;
  }, [])

  return (
    <svg style={{flexGrow: 1}} viewBox={`0 0 ${keys} ${(lead + past)}`} preserveAspectRatio="none">
      <BackgroundGrid keys={keys} shift={shift} />
      <g
        id="time"
        ref={gRef}>
        <NoteEvents notes={notes} />
      </g>
      <g
        transform={`translate(0, ${lead}) scale(${keys}, ${past})`}>
        <PastOverlay />
      </g>
    </svg>
  )
}