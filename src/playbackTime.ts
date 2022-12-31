import { useEffect, useState } from "react";

type PlaybackTimeCallback = (time: number) => void;
type Subscriber = {
  readonly callback: PlaybackTimeCallback,
  readonly resolution?: number,
  last?: number,
};
type Unsubscribe = () => void

let playbackTime = 0;
let playbackTimeSubscribers: readonly Subscriber[] = [];

function onTimeChange(now: number) {
  playbackTime = now % 60000;
  for (const sub of playbackTimeSubscribers) {
    if (sub.resolution === undefined) {
      sub.callback(playbackTime);
    }
    else {
      const floor = playbackTime - (playbackTime % sub.resolution);
      if (sub.last === undefined || floor != sub.last) {
        sub.last = floor;
        sub.callback(playbackTime);
      }
    }
  }
  window.requestAnimationFrame(onTimeChange);
}
window.requestAnimationFrame(onTimeChange);

export function subscribePlaybackTime(callback: PlaybackTimeCallback, resolution?: number): Unsubscribe {
  const subscriber: Subscriber = {
    callback,
    resolution,
  }
  playbackTimeSubscribers = [...playbackTimeSubscribers, subscriber];
  return () => {
    playbackTimeSubscribers = playbackTimeSubscribers.filter(s => s !== subscriber);
  }
}

export function usePlaybackTime(resolution: number = 50) {
  const [time, setTime] = useState<number>(playbackTime);
  useEffect(() => {
    const unsub = subscribePlaybackTime((now) => {setTime(now)}, resolution);
    return unsub;
  }, []);
  return time;
}
