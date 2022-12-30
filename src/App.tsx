import './App.css'
import {PianoRoll} from './PianoRoll';

function App() {
  return (
    <div className="App" style={{display: 'flex', flexDirection: 'column', flexGrow: 1, placeItems: 'stretch'}}>
      <PianoRoll />
    </div>
  )
}

export default App
