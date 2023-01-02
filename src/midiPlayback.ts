import { openFirstOutput, playMidi } from "./midi";
import { createObservable, makeUseOf } from "./observable";
import { observePlaybackState, observePlaybackTime } from "./playbackState";
import { beatToMs, isNote, isTempo, NoteEvent, observeTimelineEvents, TempoEvent, TimelineEvent } from "./timelineData";

type PlaybackInstance = {
  stop: () => void,
}

type NoteOnOffEvent = {
  startMs: number,
  endMs: number,
  midiNote: number,
  velocity: number,
}

const instance = createObservable<PlaybackInstance | undefined>(undefined);

const g = (window as any);
g.midiPlayback = import.meta;

function toNoteOnOffEvents(nextTimeline: readonly TimelineEvent[]): readonly NoteOnOffEvent[] {
  let tempo: TempoEvent & {startMs: number} = {
    type: "tempo",
    startBeat: 0,
    startMs: 0,
    beatsPerMinute: 120,
  }
  const output = [] as NoteOnOffEvent[]
  for (const e of nextTimeline) {
    if (isNote(e)) {
      output.push({
        midiNote: e.note + 60,
        velocity: e.velocity,
        startMs: beatToMs(e.startBeat, tempo),
        endMs: beatToMs(e.endBeat, tempo),
      })
    }
    else if (isTempo(e)) {
      tempo = {
        ...e,
        startMs: beatToMs(e.startBeat, tempo),
      }
    }
  }
  return output;
}

function startPlayback(lookaheadMs: number = 500): PlaybackInstance {
  let prev: DOMHighResTimeStamp | false = false;
  let time: DOMHighResTimeStamp = 0;
  let playing: boolean = false;
  let timeline: readonly NoteOnOffEvent[] = [];
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
    timeline = toNoteOnOffEvents(nextTimeline);
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
    const windowMin = time;
    const windowMax = time + lookaheadMs;
    const toPlay = timeline
      .filter(n => (
        (  (n.startMs >= windowMin && n.startMs < windowMax) // note starts within this time window
        || (prev === false && n.startMs < windowMin && (n.endMs) > windowMin) // or starts before it and ends after it and this is the first iteration
        ) 
        && (prev === false || n.startMs >= prev) // and we haven't already enqueued it
      ))
      .map(n => ({
        note: n.midiNote,
        start: (n.startMs - time) + now,
        length: (n.endMs - n.startMs),
        velocity: n.velocity
      }));
    if (prev === 0) {
      console.log(timeline.slice(0, 5));
    }
    console.log("queue", toPlay, time, prev);
    playMidi(midi, toPlay);
    prev = time + lookaheadMs;
  }

  function stop() {
    // TODO: figure out how to stop any notes that we've started
    //       This is tricky because we'll have queued both start and stop events
    //       We could just queue an immediate stop event for all notes we might have started
    //       But in fact if the start event is still in the future at this time, it will still play
    dispose();
  }

  function dispose() {
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
  if (instance.get() === undefined) {
    const playback = startPlayback();
    instance.set(playback);
  }
}

export function toggleMidiOut() {
  if (instance.get() === undefined) {
    enableMidiOut();
  }
  else {
    disableMidiOut();
  }
}

export function disableMidiOut() {
  const playback = instance.get();
  if (playback !== undefined) {
    playback.stop();
    instance.set(undefined);
  }
}

export const useMidiPlaybackState = makeUseOf(instance);

