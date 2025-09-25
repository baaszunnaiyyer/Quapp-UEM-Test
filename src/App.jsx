import Quapp, { BatteryBridge, FlashlightBridge } from './quapp-sdk/dist'
import quappLogo from '/quapp.png'
import './App.css'
import { useState, useEffect } from 'react'

function App() {
  const [battery, setBattery] = useState(null);

  useEffect(() => {
    // if (Quapp.isAvailable('Battery')) {
    //   const level = BatteryBridge.checkBattery();
    //   setBattery(level);
    // } else {
    //   console.warn('Battery Bridge is not available');
    // }

    // if (!Quapp.isAvailable('Flashlight')) {
    //   console.warn('Flashlight Bridge is not available');
    // }
  }, []);

  // const toggleFlashlight = () => {
  //   if (Quapp.isAvailable('Flashlight')) {
  //     FlashlightBridge.toggle();
  //   } else {
  //     console.warn('Flashlight Bridge is not available');
  //   }
  // }

  return (
    <>
      <div>
        <div>
          <img src={quappLogo} className="logo" alt="Vite logo" />
        </div>
        <p>Interact With Native components Using Your Web</p>
        <div className="card">
          <p>Edit <code>src/App.jsx</code> to see changes in your App</p>
        </div>
      </div>
      <div className="info">
        <h2>Battery Info</h2>
        {battery !== null ? (
          <ul>
            <li>Level: {battery}%</li>
          </ul>
        ) : (
          <p>Battery information is not available.</p>
        )}
        <h2>Flashlight Control</h2>
        <button
          style={{
            padding: 16,
            borderRadius: 8,
            backgroundColor: "#00000000",
            borderColor: "coral"
          }}
          onClick={() => {console.log('Flashlight toggle clicked')}}
        >
          Toggle Flashlight
        </button>
      </div>
    </>
  )
}

export default App;
