import './App.css'
import {PianoRoll} from './PianoRoll';
import { Controls } from './Controls';
import { openFirstDevice, test, useAsync, useMidiKeysDown } from './midi';
import { fileToNotes, setTimelineEvents, useTimelineEvents } from './timelineData';


const tempo = 144;

function App() {
  const notes = useTimelineEvents();
  const midi = useAsync(() => openFirstDevice(/Lexicon/));
  const notesOn = useMidiKeysDown(midi);

  return (
    <div
      className="App"
      style={{display: 'flex', flexDirection: 'column', flexGrow: 1, placeItems: 'stretch'}}
      onClick={() => {
        //test().then(() => {}).catch(e => console.error(e));
      }}
      onDrop={(e) => {
        if (e.dataTransfer.items.length > 0 && e.dataTransfer.items[0].type === 'audio/midi') {
          const file = e.dataTransfer.items[0].getAsFile();
          if (file === null) {
            console.error("No file");
            return;
          }
          fileToNotes(file)
            .then(notes => setTimelineEvents(notes))
            .catch(e => console.error(e));
          
          console.log(file);
        }
        e.preventDefault();
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}>
      <div style={{position: 'absolute'}}>
        <Controls tempo={tempo} />
      </div>
      <PianoRoll notesOn={notesOn} timeline={notes} keys={88} shift={-39} leadMs={6000} pastMs={1500} />
    </div>
  )
}

export default App
