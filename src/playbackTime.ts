import { useEffect, useState } from "react";

let playbackTime = 0;
let playbackTimeSubscribers: readonly PlaybackTimeCallback[] = [];

type PlaybackTimeCallback = (time: number) => void;
type Unsubscribe = () => void

function onTimeChange(now: number) {
  playbackTime = now % 12000; // loop 12 seconds
  for (const sub of playbackTimeSubscribers) {
    sub(playbackTime);
  }
  window.requestAnimationFrame(onTimeChange);
}
window.requestAnimationFrame(onTimeChange);

export function subscribePlaybackTime(callback: PlaybackTimeCallback): Unsubscribe {
  playbackTimeSubscribers = [...playbackTimeSubscribers, callback];
  return () => {
    playbackTimeSubscribers = playbackTimeSubscribers.filter(cb => cb !== callback);
  }
}

export function usePlaybackTime() {
  const [time, setTime] = useState<number>(playbackTime);
  useEffect(() => {
    const unsub = subscribePlaybackTime((now) => {setTime(now)});
    return unsub;
  }, []);
  return time;
}
