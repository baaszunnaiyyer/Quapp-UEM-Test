import quappLogo from '/quapp.png'
import './App.css'
import { useEffect } from 'react'

function App() {

  useEffect(() => {
    const check = async () => {
      if (Quapp.isQuappEnvironment) {
        // Get device information
        const info = await Quapp.getDeviceInfo();
        console.log(`Running on ${info.model}`);
        
        // Check battery status
        const battery = await Quapp.getBattery();
        console.log(`Battery: ${battery.level}%`);
      }else {
        console.log("Not running inside Quapp environment.");
      }
    }
  check();
  }, [])

  return (
    <>
      <div>
          <img src={quappLogo} className="logo" alt="Vite logo" />
        
      </div>
      <h1>Quapp</h1>
      <p>Build your Native apps With a Snap of a Finger</p>
      <div className="card">
        <p>
          Edit <code>src/App.jsx</code> to see Changes in you App
        </p>
      </div>
    </>
  )
}

export default App
