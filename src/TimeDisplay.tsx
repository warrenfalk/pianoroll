import { usePlaybackTime } from "./playbackTime";

type TimeDisplayProps = {
  tempo: number,
}
export function TimeDisplay({tempo}: TimeDisplayProps) {
  const timeMs = usePlaybackTime()
  const timeMinutes = (timeMs / 60000)
  const timeBeats = timeMinutes * tempo;
  return (
    <div>{Math.round(timeBeats * 100) / 100}</div>
  )
}
