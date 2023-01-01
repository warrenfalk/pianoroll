import { toggleMidiOut, useMidiPlaybackState } from "./midiPlayback";
import { controlPlayback, usePlaybackTime } from "./playbackState";

type TimeDisplayProps = {
  tempo: number,
}
export function Controls({tempo}: TimeDisplayProps) {
  const timeMs = usePlaybackTime()
  const timeMinutes = (timeMs / 60000)
  const timeBeats = timeMinutes * tempo;
  const midiPlaybackState = useMidiPlaybackState();

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
            toggleMidiOut();
          }}
          style={{
            color: midiPlaybackState ? 'blue' : 'black'
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
