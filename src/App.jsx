import Quapp, {BatteryBridge, FlashlightBridge} from '../quapp-sdk/dist'
import quappLogo from '/quapp.png'
import './App.css'
import SplitText from './components/SplitText'
import { useState } from 'react'

function App() {
  const [Battery, setBattery] = useState();
  
  console.log(
    Quapp.isAvailable('Battery'),
    Quapp.isAvailable('Flashlight')
  );

  const toggleFlashlight = () => {
    if (Quapp.isAvailable('Flashlight')) {
      FlashlightBridge.toggle();
    } else {
      console.warn('Flashlight Bridge is not available');
    }
  }

  if (Quapp.isAvailable('Battery')) {
    setBattery(BatteryBridge.checkBattery());
  }else {
    console.warn('Battery Bridge is not available');
  }

  return (
    <>
      <div >
        <div>
            <img src={quappLogo} className="logo" alt="Vite logo" />
        </div>
        <SplitText text="Quapp!" tag="h1" className="welcome-text" textAlign="center" />
        <p>Interact With Native components Using You Web</p>
        <div className="card">
          <p>
            Edit <code>src/App.jsx</code> to see Changes in you App
          </p>
        </div>
      </div>
      <div className="info">
          <h2>Battery Info</h2>
          {Battery ? (
            <ul>
              <li>Level: {Battery}%</li>
            </ul>
          ) : (
            <p>Battery information is not available.</p>
          )}
          <h2>Flashlight Control</h2>
          <button style={{padding : 16, borderRadius : 8, backgroundColor : "#00000000", borderColor : "coral"}} onClick={toggleFlashlight}>Toggle Flashlight</button>
      </div>
    </>
  )
}

export default App
