import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './global.css'
import Login from './pages/login'

function App() {
  const [count, setCount] = useState(0)

  return (
    <body>
      <Login/>
    </body>
  )
}

export default App
