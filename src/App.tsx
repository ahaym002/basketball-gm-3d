import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useGameStore } from './store/gameStore'
import { GameSettings, GameMode, DEFAULT_SETTINGS } from './types/gameSettings'
import Layout from './components/Layout'
import WelcomeScreen from './pages/WelcomeScreen'
import GameSettingsPage from './pages/GameSettings'
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
import MatchView from './pages/MatchView'

type OnboardingStep = 'welcome' | 'settings' | 'team-select'

function App() {
  const { isInitialized, initializeGame, loadFromSave } = useGameStore()
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome')
  const [selectedMode, setSelectedMode] = useState<GameMode>('fiction')
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS)

  // Handle new game flow
  const handleNewGame = (mode: GameMode) => {
    setSelectedMode(mode)
    setOnboardingStep('settings')
  }

  // Handle load game
  const handleLoadGame = (slotId: number) => {
    const success = loadFromSave(slotId)
    if (!success) {
      console.error('Failed to load save')
    }
  }

  // Handle settings confirmed
  const handleSettingsConfirm = (settings: GameSettings) => {
    setGameSettings(settings)
    setOnboardingStep('team-select')
  }

  // Handle team selection
  const handleTeamSelect = (teamId: string) => {
    initializeGame(teamId, { 
      useRealData: selectedMode === 'real',
      settings: gameSettings 
    })
  }

  // Handle back navigation in onboarding
  const handleBackToWelcome = () => {
    setOnboardingStep('welcome')
  }

  const handleBackToSettings = () => {
    setOnboardingStep('settings')
  }

  // Show onboarding flow if not initialized
  if (!isInitialized) {
    switch (onboardingStep) {
      case 'welcome':
        return (
          <WelcomeScreen 
            onNewGame={handleNewGame} 
            onLoadGame={handleLoadGame} 
          />
        )
      case 'settings':
        return (
          <GameSettingsPage
            gameMode={selectedMode}
            onConfirm={handleSettingsConfirm}
            onBack={handleBackToWelcome}
          />
        )
      case 'team-select':
        return (
          <StartScreen
            settings={gameSettings}
            onSelectTeam={handleTeamSelect}
            onBack={handleBackToSettings}
          />
        )
    }
  }

  return (
    <Routes>
      {/* Match view is outside Layout for full-screen experience */}
      <Route path="/match/:gameId" element={<MatchView />} />
      
      {/* Main app routes with Layout */}
      <Route path="/*" element={
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
      } />
    </Routes>
  )
}

export default App
