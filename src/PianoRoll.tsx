import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDimensions } from "./dimensions";
import { range } from "./iterables";
import { NoteOnInfo } from "./midi";
import { observePlaybackTime, usePlaybackTime } from "./playbackState";
import { NoteEvent } from "./timelineData";


export function noteNum(note: number) {
  return ((note % 12) + 12) % 12
}

export function noteColor(note: number) {
  const n = noteNum(note);
  return ((n < 5 ? n : n + 1) % 2) ? "black" : "white";
}

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as readonly string[];

export function noteName(note: number) {
  const n = noteNum(note);
  return noteNames[n];
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
        {[...range(0, 12)].map(n => (
          <text
            id={`note${n}`}
            style={{
              fill: 'white',
              fontSize: 0.60,
              textAnchor: 'middle',
            }}
            x={0}
            y={0}>
            {noteName(n)}
          </text>
        ))}


      </defs>
      {notes.map(({note, lengthMs, startMs, hand}) => (
        <>
          <rect
            key={`${startMs}-${note}`}
            style={{fill: `url(#hand${hand})`, stroke: 'black', strokeWidth: '1', vectorEffect: 'non-scaling-stroke'}}
            //style="color:#000000;overflow:visible;fill:#0167f9;stroke-width:3.02362;stroke-linejoin:round"
            width="1"
            height={lengthMs * 0.001}
            x={note}
            y={-((startMs + lengthMs) * 0.001)}
            rx={0.3}
            ry={0.3 * ar}
          />
          <use href={`#note${noteNum(note)}`} transform={`translate(${note + 0.5}, ${-(startMs * 0.001) - (0.3 * ar)}) scale(1, ${ar})`} />
        </>
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
        <rect
          id="rect-black"
          style={{fill: "url(#black)"}}
          //style="color:#000000;overflow:visible;fill:#0167f9;stroke-width:3.02362;stroke-linejoin:round"
          width="1"
          height="100%"
          y={0}
        />
        <rect
          id="rect-white"
          style={{fill: 'url(#white)'}}
          width="1"
          height="100%"
          y={0}
        />
      </defs>
      {[...range(shift, keys)].map(n => (
        <use key={n} href={`#rect-${noteColor(n)}`} x={n - shift} />
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

function filterVisible(timeline: readonly NoteEvent[], earliestMs: number, latestMs: number): readonly NoteEvent[] {
  return timeline.filter(e => !(e.startMs > earliestMs || (e.startMs + e.lengthMs) < latestMs));
}

type PianoRollProps = {
  timeline?: readonly NoteEvent[],
  notesOn?: readonly NoteOnInfo[],
  // how many piano keys to show
  keys?: number,
  // shift by how many keys
  shift?: number,
  // how many miliseconds of the future to show
  leadMs?: number,
  // how many miliseconds of the past to show
  pastMs?: number,
}
export function PianoRoll({timeline = [], notesOn = [], keys = 88, leadMs = 2750, pastMs = 750, shift = -39}: PianoRollProps) {
  const [dimensions, svgRef] = useDimensions<SVGSVGElement>()
  const time = usePlaybackTime(2000);

  // Filter only the visible notes for performance
  // this is the latest edge
  const bottomEdgeMs = time - (leadMs + pastMs);
  // this is the earliest edge (padded by 2 seconds)
  const topEdgeMs = time + 2000;
  const visible = filterVisible(timeline, topEdgeMs, bottomEdgeMs);

  const heightMs = (leadMs + pastMs);
  const heightSeconds = heightMs * 0.001;
  const ar = (dimensions ? (dimensions.width / dimensions.height) : 1) * heightSeconds / keys;
  const gRef = useRef<SVGGraphicsElement>(null);
  useEffect(() => {
    const unsub = observePlaybackTime(time => {
      const g = gRef.current;
      if (g)
        g.style.transform = `translate(${-shift}px, ${time / 1000}px)`;
    });
    return unsub;
  }, [])

  return (
    <svg ref={svgRef} style={{flexGrow: 1, flexShrink: 1}} viewBox={`0 0 ${keys} ${heightSeconds}`} preserveAspectRatio="none">
      <BackgroundGrid keys={keys} shift={shift} />
      <g
        id="time"
        ref={gRef}>
        <NoteEvents notes={visible} ar={ar} />
      </g>
      <g
        transform={`translate(0, ${leadMs * 0.001}) scale(${keys}, ${pastMs * 0.001})`}>
        <PastOverlay />
      </g>
      <g transform={`translate(${-shift}, ${leadMs * 0.001}) scale(1, ${ar})`}>
        <NotesOn notesOn={notesOn} />
      </g>
    </svg>
  )
}