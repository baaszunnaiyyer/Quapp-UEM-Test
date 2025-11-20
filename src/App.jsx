import quappLogo from '/quapp.png'
import './App.css'
import { useEffect, useLayoutEffect, useState } from 'react'

function App() {
  const [battery, setBattery] = useState(null);
  const [didRun, setDidRun] = useState("");

  let x = 0;

  useEffect(() => {
    console.log("asd");
    
    const check = async () => {
      console.log(typeof (window.Quapp));

      if (window.Quapp.isQuappEnvironment) {
        setDidRun("Running inside Quapp environment.");
        // Get device information
        const info = await Quapp.getDeviceInfo();
        console.log(`Running on ${info.model}`);
        
        // Check battery status
        const battery = await Quapp.getBattery();
        setBattery(battery.level);
        console.log(`Battery: ${battery.level}%`);
      }else {
        console.log("Not running inside Quapp environment.");
        setDidRun("Not running inside Quapp environment.")
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
          {didRun}
        </p>
      </div>
      {battery ? (
        <p>Battery Level: {battery}%</p>
      ) : (
        <p>Battery information not available.</p>
      )}
    </>
  )
}

export default App
