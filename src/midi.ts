import { useEffect, useState } from "react";

declare global {
  interface Navigator {
    requestMIDIAccess: () => Promise<MIDIAccess>
  }

  type MIDIAccess = {
    inputs: MIDIInputMap,
    outputs: MIDIOutputMap,
    sysexEnabled: boolean,
    statechange_event: (e: Event) => void,
  }

  type MIDIInputMap = ReadonlyMap<string, MIDIInput>

  type MIDIOutputMap = ReadonlyMap<any, any>

  interface MIDIMessageEvent extends Event {
    data: Uint8Array;
    type: "midimessage"
  }

  interface MIDIInput extends MIDIPort {
    onmidimessage: null | ((e: MIDIMessageEvent) => void);
    readonly type: "input";
  }

  interface MIDIOutput extends MIDIPort {
    send(data: readonly number[] | Uint8Array, timestamp?: DOMHighResTimeStamp): void,
    clear(): void,
  }

  interface MIDIPort {
    readonly id: string;
    readonly manufacturer: string;
    readonly name: string;
    readonly type: "input" | "output"
    readonly version: string;
    readonly state: "disconnected" | "connected";
    readonly connection: "open" | "closed" | "pending";
    onstatechange?: () => void;
    open(): Promise<void>;
    close(): Promise<void>;
  }
}

async function delay(ms: number) { return new Promise<void>(resolve => setInterval(() => resolve(), ms))};

export async function test() {
  console.log('requesting MIDI access...');
  const x = await navigator.requestMIDIAccess();
  console.log(x);
  for (const [id, input] of x.outputs) {
    if (/Lexicon/.test(input.name)) {
      console.log("opening");
      await input.open();
      console.log("note on");
      input.send([0x90, 60, 0x70], window.performance.now() + 1000);
      //await delay(1000);
      //console.log("note off");
      input.send([0x80, 60, 0x70], window.performance.now() + 2000);
    }
  }
}

export async function openFirstDevice(namePattern: RegExp): Promise<MIDIInput | undefined> {
  const midi = await navigator.requestMIDIAccess();
  for (const [_, input] of midi.inputs) {
    if (namePattern.test(input.name)) {
      await input.open();
      return input;
    }
  }
  return undefined;
}

export async function openFirstOutput(namePattern: RegExp): Promise<MIDIOutput | undefined> {
  const midi = await navigator.requestMIDIAccess();
  for (const [_, output] of midi.outputs) {
    if (namePattern.test(output.name)) {
      await output.open();
      return output;
    }
  }
  return undefined;
}

export function useAsync<T>(asyncFunc: () => Promise<T>) {
  const [result, setResult] = useState<T>();
  useEffect(() => {
    setResult(undefined);
    asyncFunc().then(result => setResult(result)).catch(() => setResult(undefined));
  }, [])
  return result;
}

export type NoteOnInfo = {
  note: number,
  velocity: number,
  sinceMs?: DOMHighResTimeStamp,
}

export function useMidiKeysDown(device: MIDIInput | undefined) {
  const [keysDown, setKeysDown] = useState<readonly NoteOnInfo[]>([])
  useEffect(() => {
    console.log("installed, device=", device);
    if (device) {
      const notesOn = new Map<number, readonly [number, DOMHighResTimeStamp]>();
      device.onmidimessage = (e) => {
        const now = performance.now();
        if (e.data.length <= 1)
          return;
        const [type, ...args] = e.data;
        if (type === 144 || type === 128) {
          const [note, velocity] = args;
          if (type === 128 || velocity === 0) {
            notesOn.delete(note);
          }
          else {
            notesOn.set(note, [velocity, now]);
          }
          const keys = Array.from(notesOn.entries()).map(([note, [velocity, sinceMs]]) => ({note: note - 60, velocity, sinceMs}));
          setKeysDown(keys);
        }
        console.log("note", JSON.stringify(Array.from(e.data)));
      }
      device.open();
      return () => {
        device.onmidimessage = null;
      }
    }
  }, [device])
  return keysDown;
}


export async function playMidi(toPlay: { note: number; start: number; length: number; velocity: number; }[]) {
    const device = await openFirstOutput(/Lexicon/);
    for (const note of toPlay) {
      device?.send([0x90, note.note, note.velocity], note.start);
      device?.send([0x80, note.note, note.velocity], note.start + note.length);
    }
}
