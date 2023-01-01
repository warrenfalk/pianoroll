import { useEffect, useState } from "react";
import assertNever from 'assert-never';
import { NoteEvent } from "./timelineData";
import { createObservable } from "./observable";

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

let playingObservable = createObservable(false);

let prevMs = 0;
let playbackTime = 0;
let playbackTimeSubscribers: readonly Subscriber[] = [];

function onAnimationFrame(nowMs: number) {
  const delta = prevMs > 0 ? nowMs - prevMs : 0;
  prevMs = nowMs;
  if (playingObservable.get()) {
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

export function observePlaybackTime(callback: PlaybackTimeCallback, resolution?: number): Unsubscribe {
  const subscriber: Subscriber = {
    callback,
    resolution,
  }
  playbackTimeSubscribers = [...playbackTimeSubscribers, subscriber];
  return () => {
    playbackTimeSubscribers = playbackTimeSubscribers.filter(s => s !== subscriber);
  }
}

export function usePlaybackTime(resolutionMs: number = 50) {
  const [time, setTime] = useState<number>(playbackTime);
  useEffect(() => {
    const unsub = observePlaybackTime((now) => {setTime(now)}, resolutionMs);
    return unsub;
  }, []);
  return time;
}

export function getPlaybackTime() {
  return playbackTime;
}

export const observePlaybackState = playingObservable.observe;

export function controlPlayback(event: ControlEvent) {
  switch (event.event) {
    case "play": {
      playingObservable.set(true);
      break;
    }
    case "pause": {
      playingObservable.set(false);
      break;
    }
    case "toggle": {
      playingObservable.set(!playingObservable.get());
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