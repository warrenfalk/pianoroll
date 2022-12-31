import { useEffect, useState } from "react";
import assertNever from 'assert-never';
import { NoteEvent } from "./timelineData";

export type PlaybackTimeCallback = (time: number) => void;
type Subscriber = {
  readonly callback: PlaybackTimeCallback,
  readonly resolution?: number,
  last?: number,
};
type Unsubscribe = () => void

export type ControlEvent
  = {
    event: "play" | "pause" | "reset" | "toggle"
  }

let playing = true;
let prevMs = 0;
let playbackTime = 0;
let playbackTimeSubscribers: readonly Subscriber[] = [];

function onAnimationFrame(nowMs: number) {
  const delta = prevMs > 0 ? nowMs - prevMs : 0;
  prevMs = nowMs;
  if (playing) {
    playbackTime = playbackTime + delta;
  }
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
  window.requestAnimationFrame(onAnimationFrame);
}
window.requestAnimationFrame(onAnimationFrame);

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

export function controlPlayback(event: ControlEvent) {
  switch (event.event) {
    case "play": {
      playing = true;
      break;
    }
    case "pause": {
      playing = false;
      break;
    }
    case "toggle": {
      playing = !playing;
      break;
    }
    case "reset": {
      playbackTime = 0;
      break;
    }
    default:
      assertNever(event.event);
  }
}