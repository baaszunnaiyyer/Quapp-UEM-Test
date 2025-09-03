import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ClickSpark from './components/ClickSpark'
createRoot(document.getElementById('root')).render(
  <StrictMode>
  <ClickSpark
    sparkColor='#333'
    sparkSize={10}
    sparkRadius={15}
    sparkCount={8}
    duration={400}>
      <App /> 
    </ClickSpark>
  </StrictMode>,
)
