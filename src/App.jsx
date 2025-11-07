import { useState } from 'react'
import './global.css'
import Login from './pages/login'
import Cadastro from './pages/cadastro'
import HomePage from './pages/home'

function App() {
  const [count, setCount] = useState(0)

  return (
    <body>
      <Login/>
</body>
  )
}

export default App
