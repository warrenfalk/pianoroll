import assertNever from "assert-never";
import { useEffect, useRef } from "react";
import { useDimensions } from "./dimensions";
import { range } from "./iterables";
import { NoteOnInfo } from "./midi";
import { observePlaybackTime, usePlaybackTime } from "./playbackState";
import { beatToMs, TempoInfo, TimelineEvent } from "./timelineData";

type TimelineItem = Note | Beat | TempoChange | MeterChange;

type Note = {
  type: "note",
  note: number,
  timeMs: number,
  endMs: number,
  hand: number,
}

type Beat = {
  type: "beat",
  timeMs: number,
  measure: number,
  beatNumber: number,
  number: number,
}

type TempoChange = {
  type: "tempo",
  tempo: number,
  prev: number,
  timeMs: number,
}

type MeterChange = {
  type: "meter",
  meter: number,
  prev: number,
  timeMs: number,
}

function isNote(item: TimelineItem): item is Note { return item.type === "note" };
function isBeat(item: TimelineItem): item is Beat { return item.type === "beat" };

export function noteNum(note: number) {
  return ((note % 12) + 12) % 12
}

export function noteColor(note: number) {
  const n = noteNum(note);
  return ((n < 5 ? n : n + 1) % 2) ? "black" : "white";
}

function noteX(note: number) {
  return Math.floor(note / 12) * 12 + notePos[noteNum(note)][0];
}

function noteWidth(note: number) {
  return notePos[noteNum(note)][1];
}

const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as readonly string[];
const notePos = [
  [0,1.71428571428571], // C
  [1.06545454545455,0.996363636363636], // C#
  [1.71428571428571,1.71428571428571], // D
  [3.10181818181818,0.996363636363636], // D#
  [3.42857142857143,1.71428571428571], // E
  [5.14285714285714,1.71428571428571], // F
  [6.17090909090909,0.996363636363636], // F#
  [6.85714285714286,1.71428571428571], // G
  [8.20727272727273,0.996363636363636], // G#
  [8.57142857142857,1.71428571428571], // A
  [10.2436363636364,0.996363636363636], // A#
  [10.2857142857143,1.71428571428571], // B
]

export function noteName(note: number) {
  const n = noteNum(note);
  return noteNames[n];
}

type BarsProps = {
  beats: readonly Beat[],
  ar: number,
}
function Bars({beats, ar}: BarsProps) {
  return (
    <g id="bars">
      {beats.map(({timeMs, measure, beatNumber, number}) => (
        <>
          <line key={`beat${timeMs}`} x1={-39} x2={88} y1={timeMs * -0.001} y2={timeMs * -0.001} style={{opacity: beatNumber ? 0.15 : 0.6, stroke: 'black', strokeWidth: '1', vectorEffect: 'non-scaling-stroke'}} />
          {beatNumber === 0
          ? (
            <text key={`lbl${timeMs}`} x={-39 + 0.5} y={0} style={{fontSize: 0.8}} transform={`translate(0, ${(timeMs * -0.001) - (0.5 * ar)}) scale(1, 0.13)`}>
              {measure}
            </text>
          ) : null}
        </>
      ))}
    </g>
  )
}

type NoteEventsProps = {
  notes: readonly Note[],
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
      {notes.map(({note, endMs, timeMs, hand}) => (
        <>
          <rect
            key={`${timeMs}-note-${note}`}
            style={{fill: `url(#hand${hand})`, stroke: 'black', strokeWidth: '1', vectorEffect: 'non-scaling-stroke'}}
            //style="color:#000000;overflow:visible;fill:#0167f9;stroke-width:3.02362;stroke-linejoin:round"
            width={noteWidth(note)}
            height={(endMs - timeMs) * 0.001}
            x={noteX(note)}
            y={-(endMs * 0.001)}
            rx={0.3}
            ry={0.3 * ar}
            cursor={'pointer'}
          />
          <use
            key={`${timeMs}-lbl-${note}`}
            href={`#note${noteNum(note)}`}
            transform={`translate(${note + 0.5}, ${-(timeMs * 0.001) - (0.3 * ar)}) scale(1, ${ar})`}
          />
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
  // adjustment for a y coordinate to make 1:1 aspect with x coordinate space
  ar: number,
}
function BackgroundGrid({keys, shift, ar}: BackgroundGridProps) {
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
          width={noteWidth(1)}
          height={`calc(100% - ${3.5 * ar}px)`}
          y={0}
        />
        <rect
          id="rect-white"
          style={{fill: 'url(#white)'}}
          width={noteWidth(0)}
          height="100%"
          y={0}
        />
      </defs>
      {[...range(shift, keys)].filter(k => noteColor(k) === "white").map(n => (
        <use key={n} href={`#rect-white`} x={noteX(n) - shift} />
      ))}
      {[...range(shift, keys)].filter(k => noteColor(k) === "black").map(n => (
        <use key={n} href={`#rect-black`} x={noteX(n) - shift} />
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

function filterVisible(timeline: readonly TimelineItem[], maxMs: number, minMs: number): readonly TimelineItem[] {
  return timeline.filter(e => !(e.timeMs >= maxMs || ("endMs" in e ? e.endMs : e.timeMs) < minMs));
}

type PianoRollProps = {
  timeline?: readonly TimelineEvent[],
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
  const bottomEdgeMs = time - pastMs;
  // this is the earliest edge (padded by 2 seconds)
  const topEdgeMs = time + leadMs + 2000;
  const items = toTimelineItems(timeline);
  const visible = filterVisible(items, topEdgeMs, bottomEdgeMs);

  const heightMs = (leadMs + pastMs);
  const heightSeconds = heightMs * 0.001;
  const ar = (dimensions ? (dimensions.width / dimensions.height) : 1) * heightSeconds / keys;
  const gRef = useRef<SVGGraphicsElement>(null);
  useEffect(() => {
    const unsub = observePlaybackTime(time => {
      const g = gRef.current;
      if (g)
        g.style.transform = `translate(${-shift}px, ${(time + leadMs) / 1000}px)`;
    });
    return unsub;
  }, [])

  return (
    <svg ref={svgRef} style={{flexGrow: 1, flexShrink: 1}} viewBox={`0 0 ${keys} ${heightSeconds}`} preserveAspectRatio="none">
      <BackgroundGrid keys={keys} shift={shift} ar={ar}/>
      <g
        id="time"
        ref={gRef}>
        <NoteEvents notes={visible.filter(isNote)} ar={ar} />
        <Bars beats={visible.filter(isBeat)} ar={ar} />
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

function toTimelineItems(timeline: readonly TimelineEvent[]): readonly TimelineItem[] {
  const output = [] as TimelineItem[];
  let tempo: TempoInfo = {
    beatsPerMinute: 120,
    startBeat: 0,
    startMs: 0,
  }
  let lastBeatMs = 0;
  let lastBeat = 0;
  let beatsPerMeasure = 4;
  let meterStartBeat = 0;
  let measure = 1;

  output.push({
    type: "beat",
    measure: 1,
    beatNumber: 0,
    number: 0,
    timeMs: 0,
  });

  for (const e of timeline) {
    const endBeat = ("endBeat" in e ? e.endBeat : e.startBeat);
    const timeMs = beatToMs(e.startBeat, tempo);
    const endMs = beatToMs(endBeat, tempo);

    while (e.startBeat >= (lastBeat + 1)) {
      const nextBeat = lastBeat + 1;
      const nextBeatMs = lastBeat > tempo.startBeat
        ? beatToMs(nextBeat, {beatsPerMinute: tempo.beatsPerMinute, startBeat: lastBeat, startMs: lastBeatMs})
        : beatToMs(nextBeat, tempo)
      const beatNumber = (nextBeat - meterStartBeat) % beatsPerMeasure;
      measure = beatNumber === 0 ? measure + 1 : measure;
      output.push({
        type: "beat",
        measure,
        beatNumber,
        number: nextBeat,
        timeMs: nextBeatMs,
      });
      lastBeat = nextBeat
      lastBeatMs = nextBeatMs;
    }
    
    switch (e.type) {
      case "note": {
        output.push({
          type: "note",
          note: e.note,
          timeMs,
          endMs,
          hand: e.hand,
        });
        break;
      }
      case "meter": {
        output.push({
          type: "meter",
          meter: e.beatsPerMeasure,
          prev: beatsPerMeasure,
          timeMs,
        })
        beatsPerMeasure = e.beatsPerMeasure;
        meterStartBeat = e.startBeat;
        break;
      }
      case "tempo": {
        output.push({
          type: "tempo",
          tempo: e.beatsPerMinute,
          prev: tempo.beatsPerMinute,
          timeMs,
        });
        tempo = {
          ...e,
          startMs: timeMs
        }
        break;
      }
      default: {
        assertNever(e);
      }
    }
  }
  return output;
}


