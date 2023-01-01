import { openFirstOutput, playMidi } from "./midi";
import { createObservable } from "./observable";
import { observePlaybackState, observePlaybackTime } from "./playbackState";
import { NoteEvent, observeTimelineEvents } from "./timelineData";

type PlaybackInstance = {
  stop: () => void,
}

let playback: PlaybackInstance | undefined = undefined;

const g = (window as any);
g.midiPlayback = import.meta;

function startPlayback(lookaheadMs: number = 500): PlaybackInstance {
  let queued: DOMHighResTimeStamp | false = false;
  let time: DOMHighResTimeStamp = 0;
  let playing: boolean = false;
  let timeline: readonly NoteEvent[] = [];
  let midi: MIDIOutput | undefined = undefined;

  openFirstOutput(/Lexicon/)
    .then(output => {
      midi = output;
      sync();
    })
    .catch(e => {
      console.error("Midi Device", e);
    })

  let dispose0 = observePlaybackTime(now => {
    time = now;
    sync();
  }, lookaheadMs * 0.5);

  let dispose1 = observePlaybackState(state => {
    playing = state;
    sync();
  })

  let dispose2 = observeTimelineEvents(nextTimeline => {
    timeline = nextTimeline;
    sync();
  })

  function sync() {
    if (g.midiPlayback !== import.meta) {
      console.log("unloading");
      stop();
      return;
    }
    if (midi === undefined) {
      return;
    }
    if (time === 0 || playing === false) {
      return;
    }
    const now = performance.now();
    const toPlay = timeline
      .filter(n => ((n.startMs >= time) && (n.startMs < (time + lookaheadMs)) && (queued === false || n.startMs >= queued)))
      .map(n => ({
        note: n.note + 60,
        start: (n.startMs - time) + now,
        length: n.lengthMs,
        velocity: n.velocity
      }));
    if (queued === 0) {
      console.log(timeline.slice(0, 5));
    }
    console.log("queue", toPlay, time, queued);
    playMidi(midi, toPlay);
    queued = time + lookaheadMs;
  }

  function stop() {
    dispose2();
    dispose1();
    dispose0();
    midi?.close();
  }
  return {
    stop,
  }
}

export function enableMidiOut() {
  if (playback === undefined) {
    playback = startPlayback();
  }
}

export function toggleMidiOut() {
  if (playback === undefined) {
    enableMidiOut();
  }
  else {
    disableMidiOut();
  }
}

export function disableMidiOut() {
  if (playback !== undefined) {
    playback.stop();
    playback = undefined;
  }
}