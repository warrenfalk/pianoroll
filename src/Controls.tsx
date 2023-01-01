import { playMidi } from "./midi";
import { controlPlayback, getPlaybackTime, usePlaybackTime } from "./playbackState";
import { useTimelineEvents } from "./timelineData";

type TimeDisplayProps = {
  tempo: number,
}
export function Controls({tempo}: TimeDisplayProps) {
  const timeMs = usePlaybackTime()
  const timeMinutes = (timeMs / 60000)
  const timeBeats = timeMinutes * tempo;
  const notes = useTimelineEvents();

  return (
    <div
      style={{
        width: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'end',
        gap: 5,
        padding: 5,
        backgroundColor: 'white',
      }}>
      <div
        className="buttons"
        style={{
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: 120,
          display: 'flex',
        }}>
        <button
          onClick={() => {
            controlPlayback({event: "reset"})
          }}>
          {'⇤'}
        </button>
        <button
          onClick={() => {
            controlPlayback({event: "toggle"})
          }}>
          {'⏯'}
        </button>
        <button
          onClick={() => {
            const now = performance.now();
            const time = getPlaybackTime() - 6000;
            const window = 8000;
            console.log(time, now);
            const toPlay = notes
              .filter(n => ((n.startMs > time) && (n.startMs < (time + window))) || (n.startMs < time && (n.startMs + n.lengthMs) > time))
              .map(n => ({
                note: n.note + 60,
                start: (n.startMs - time) + now,
                length: n.lengthMs,
                velocity: n.velocity
              }));
            playMidi(toPlay);
          }}>
          {'🕪'}
        </button>
      </div>
      <div
        className="time"
        style={{
          flexGrow: 1,
          flexShrink: 0,
          flexBasis: 100,
          textAlign: 'right',
        }}>
          {Math.floor(timeBeats)}.{Math.floor((timeBeats % 1) * 10)}
      </div>
    </div>
  )
}
