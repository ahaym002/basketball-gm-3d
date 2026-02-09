import { Routes, Route, Navigate } from 'react-router-dom'
import { useGameStore } from './store/gameStore'
import Layout from './components/Layout'
import StartScreen from './pages/StartScreen'
import Dashboard from './pages/Dashboard'
import Roster from './pages/Roster'
import Standings from './pages/Standings'
import Schedule from './pages/Schedule'
import FreeAgents from './pages/FreeAgents'
import Trade from './pages/Trade'
import Draft from './pages/Draft'
import Finances from './pages/Finances'
import PlayerProfile from './pages/PlayerProfile'

function App() {
  const { isInitialized } = useGameStore()

  if (!isInitialized) {
    return <StartScreen />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/free-agents" element={<FreeAgents />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="/draft" element={<Draft />} />
        <Route path="/finances" element={<Finances />} />
        <Route path="/player/:playerId" element={<PlayerProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
