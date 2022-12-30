
// -39

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

type NoteEvent = {
  note: number,
  start: number,
  length: number,
  hand: 0 | 1,
}

type NotesProps = {
  notes: readonly NoteEvent[],
}
function Notes({notes}: NotesProps) {
  return (
    <g
      id="notes"
      transform="translate(0, 9)">
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
          x={note + 39}
          y={-(start + length)}
          rx={0.3}
          ry={0.09}
        />
      ))}
    </g>
  )
}

function BackgroundGrid() {
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
      {[...range(-39, 88)].map(n => (
        <rect
          key={n}
          style={{fill: noteColor(n) === "white" ? "url(#white)" : "url(#black)"}}
          //style="color:#000000;overflow:visible;fill:#0167f9;stroke-width:3.02362;stroke-linejoin:round"
          width="1"
          height="100%"
          x={n + 39}
          y={0}
        />
      ))}
    </g>
  )
}

export function PianoRoll() {
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
    <svg style={{flexGrow: 1}} viewBox="0 0 88 12" preserveAspectRatio="none">
      <BackgroundGrid />
      <Notes notes={notes} />
    </svg>
  )
}