import { usePlaybackTime } from "./playbackTime";

type TimeDisplayProps = {
  tempo: number,
}
export function Controls({tempo}: TimeDisplayProps) {
  const timeMs = usePlaybackTime()
  const timeMinutes = (timeMs / 60000)
  const timeBeats = timeMinutes * tempo;
  return (
    <div
      style={{
        width: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'end',
        gap: 5,
        padding: 5,
        backgroundColor: 'white',
      }}>
      <div
        className="play"
        style={{
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: 60,
        }}>
        <button>⏯</button>
      </div>
      <div
        className="time"
        style={{
          flexGrow: 1,
          flexShrink: 0,
          flexBasis: 100,
          textAlign: 'right',
        }}>
          {Math.round(timeBeats * 10) / 10}
      </div>
    </div>
  )
}
