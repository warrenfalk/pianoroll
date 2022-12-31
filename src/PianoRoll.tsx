import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDimensions } from "./dimensions";
import { range } from "./iterables";
import { NoteOnInfo } from "./midi";
import { subscribePlaybackTime } from "./playbackState";
import { NoteEvent } from "./timelineData";

export function noteColor(note: number) {
  const n = ((note % 12) + 12) % 12;
  return ((n < 5 ? n : n + 1) % 2) ? "black" : "white";
}

type NoteEventsProps = {
  notes: readonly NoteEvent[],
  // adjustment for a y coordinate to make 1:1 aspect with x coordinate space
  ar: number,
}
function NoteEvents({notes, ar}: NoteEventsProps) {
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
      {notes.map(({note, lengthMs, startMs, hand}) => (
        <rect
          key={`${startMs}-${note}`}
          style={{fill: `url(#hand${hand})`, stroke: 'black', strokeWidth: '1', vectorEffect: 'non-scaling-stroke'}}
          //style="color:#000000;overflow:visible;fill:#0167f9;stroke-width:3.02362;stroke-linejoin:round"
          width="1"
          height={lengthMs}
          x={note}
          y={-(startMs + lengthMs)}
          rx={0.3}
          ry={0.3 * ar}
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

type NotesOnProps = {
  notesOn: readonly NoteOnInfo[];
}
function NotesOn({notesOn}: NotesOnProps) {
  return (
    <g>
      {notesOn.map(({note}) => (
        <rect
          style={{fill: 'blue', opacity: '0.5'}}
          x={note}
          y={-0.5}
          width={1}
          height={1}
        />
      ))}
    </g>
  )
}

type PianoRollProps = {
  timeline?: readonly NoteEvent[],
  notesOn?: readonly NoteOnInfo[],
  // how many piano keys to show
  keys?: number,
  // shift by how many keys
  shift?: number,
  // how many seconds of the future to show
  lead?: number,
  // how many seconds of the past to show
  past?: number,
}
export function PianoRoll({timeline = [], notesOn = [], keys = 88, lead = 2.75, past = 0.75, shift = -39}: PianoRollProps) {
  const [dimensions, svgRef] = useDimensions<SVGSVGElement>()
  const ar = (dimensions ? (dimensions.width / dimensions.height) : 1) * (lead + past) / keys;
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
    <svg ref={svgRef} style={{flexGrow: 1, flexShrink: 1}} viewBox={`0 0 ${keys} ${lead + past}`} preserveAspectRatio="none">
      <BackgroundGrid keys={keys} shift={shift} />
      <g
        id="time"
        ref={gRef}>
        <NoteEvents notes={timeline} ar={ar} />
      </g>
      <g
        transform={`translate(0, ${lead}) scale(${keys}, ${past})`}>
        <PastOverlay />
      </g>
      <g transform={`translate(${-shift}, ${lead}) scale(1, ${ar})`}>
        <NotesOn notesOn={notesOn} />
      </g>
    </svg>
  )
}