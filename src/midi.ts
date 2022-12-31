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

  interface MIDIInput extends MIDIPort {
    onmidimessage: () => void;
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

export async function midi() {
  console.log('requesting MIDI access...');
  const x = await navigator.requestMIDIAccess();
  console.log(x);
  for (const [id, input] of x.outputs) {
    if (/Lexicon/.test(input.name)) {
      console.log("opening");
      await input.open();
      console.log("note on");
      input.send([0x90, 60, 0x70]);
      await delay(1000);
      console.log("note off");
      input.send([0x80, 60, 0x70]);
    }
  }
}