import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { formatCurrency, getRatingClass } from '../utils/format'
import { ArrowLeftRight, Plus, X, Check, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export default function Trade() {
  const { state, getUserTeam, getTeamPlayers, proposeTrade } = useGameStore()
  const [targetTeamId, setTargetTeamId] = useState<string>('')
  const [sendPlayers, setSendPlayers] = useState<string[]>([])
  const [receivePlayers, setReceivePlayers] = useState<string[]>([])
  
  const team = getUserTeam()
  const userPlayers = team ? getTeamPlayers(team.id) : []
  const targetTeam = targetTeamId ? state?.teams[targetTeamId] : null
  const targetPlayers = targetTeamId ? getTeamPlayers(targetTeamId) : []
  
  if (!state || !team) {
    return <div className="text-gray-400">Loading...</div>
  }
  
  const otherTeams = Object.values(state.teams).filter(t => t.id !== team.id)
  
  const toggleSendPlayer = (id: string) => {
    if (sendPlayers.includes(id)) {
      setSendPlayers(sendPlayers.filter(p => p !== id))
    } else {
      setSendPlayers([...sendPlayers, id])
    }
  }
  
  const toggleReceivePlayer = (id: string) => {
    if (receivePlayers.includes(id)) {
      setReceivePlayers(receivePlayers.filter(p => p !== id))
    } else {
      setReceivePlayers([...receivePlayers, id])
    }
  }
  
  const sendValue = sendPlayers.reduce((sum, id) => {
    const p = state.players[id]
    return sum + (p?.stats.overall || 0)
  }, 0)
  
  const receiveValue = receivePlayers.reduce((sum, id) => {
    const p = state.players[id]
    return sum + (p?.stats.overall || 0)
  }, 0)
  
  const handlePropose = () => {
    if (sendPlayers.length === 0 || receivePlayers.length === 0 || !targetTeamId) return
    
    const success = proposeTrade({
      targetTeamId,
      sendPlayerIds: sendPlayers,
      receivePlayerIds: receivePlayers,
    })
    
    if (success) {
      setSendPlayers([])
      setReceivePlayers([])
    }
  }
  
  const clearTrade = () => {
    setSendPlayers([])
    setReceivePlayers([])
  }
  
  const canPropose = sendPlayers.length > 0 && receivePlayers.length > 0 && targetTeamId
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Trade Center</h1>
        <p className="text-gray-400">Propose trades with other teams</p>
      </div>
      
      {/* Team Selector */}
      <div className="card p-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Trade With:
        </label>
        <select
          value={targetTeamId}
          onChange={e => {
            setTargetTeamId(e.target.value)
            setReceivePlayers([])
          }}
          className="input max-w-xs"
        >
          <option value="">Select a team...</option>
          {otherTeams.map(t => (
            <option key={t.id} value={t.id}>
              {t.city} {t.name} ({t.wins}-{t.losses})
            </option>
          ))}
        </select>
      </div>
      
      {/* Trade Interface */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Your Team */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <span 
              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: team.colors.primary }}
            >
              {team.abbreviation}
            </span>
            <span>{team.city} {team.name}</span>
            <span className="text-gray-500 text-xs ml-auto">You Send</span>
          </div>
          
          <div className="divide-y divide-surface-200 max-h-96 overflow-y-auto">
            {userPlayers.map(player => {
              const isSelected = sendPlayers.includes(player.id)
              
              return (
                <button
                  key={player.id}
                  onClick={() => toggleSendPlayer(player.id)}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-3 hover:bg-surface-100 transition-colors text-left',
                    isSelected && 'bg-primary/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                      isSelected ? 'bg-primary border-primary' : 'border-surface-300'
                    )}>
                      {isSelected && <Check size={12} />}
                    </span>
                    <div>
                      <p className="font-medium">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {player.position} • {player.age}yo • {formatCurrency(player.contract.salary)}
                      </p>
                    </div>
                  </div>
                  <span className={getRatingClass(player.stats.overall)}>
                    {player.stats.overall}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Target Team */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            {targetTeam ? (
              <>
                <span 
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: targetTeam.colors.primary }}
                >
                  {targetTeam.abbreviation}
                </span>
                <span>{targetTeam.city} {targetTeam.name}</span>
              </>
            ) : (
              <span className="text-gray-500">Select a team</span>
            )}
            <span className="text-gray-500 text-xs ml-auto">You Receive</span>
          </div>
          
          {targetTeam ? (
            <div className="divide-y divide-surface-200 max-h-96 overflow-y-auto">
              {targetPlayers.map(player => {
                const isSelected = receivePlayers.includes(player.id)
                
                return (
                  <button
                    key={player.id}
                    onClick={() => toggleReceivePlayer(player.id)}
                    className={clsx(
                      'w-full flex items-center justify-between px-4 py-3 hover:bg-surface-100 transition-colors text-left',
                      isSelected && 'bg-accent/20'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        isSelected ? 'bg-accent border-accent' : 'border-surface-300'
                      )}>
                        {isSelected && <Check size={12} />}
                      </span>
                      <div>
                        <p className="font-medium">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {player.position} • {player.age}yo • {formatCurrency(player.contract.salary)}
                        </p>
                      </div>
                    </div>
                    <span className={getRatingClass(player.stats.overall)}>
                      {player.stats.overall}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Select a team to trade with
            </div>
          )}
        </div>
      </div>
      
      {/* Trade Summary */}
      {(sendPlayers.length > 0 || receivePlayers.length > 0) && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Trade Summary</h3>
            <button 
              onClick={clearTrade}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-4">
            {/* You Send */}
            <div className="bg-surface-100 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">You Send</p>
              {sendPlayers.length === 0 ? (
                <p className="text-sm text-gray-600">No players selected</p>
              ) : (
                <div className="space-y-1">
                  {sendPlayers.map(id => {
                    const p = state.players[id]
                    return (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span>{p?.firstName} {p?.lastName}</span>
                        <span className={getRatingClass(p?.stats.overall || 0)}>
                          {p?.stats.overall}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Value Comparison */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <ArrowLeftRight size={24} className="text-gray-500 mx-auto mb-2" />
                <div className="flex items-center gap-3 text-sm">
                  <span className={clsx(
                    'font-bold',
                    sendValue > receiveValue ? 'text-accent-red' : 'text-primary'
                  )}>
                    {sendValue}
                  </span>
                  <span className="text-gray-500">vs</span>
                  <span className={clsx(
                    'font-bold',
                    receiveValue > sendValue ? 'text-primary' : 'text-accent-red'
                  )}>
                    {receiveValue}
                  </span>
                </div>
                {Math.abs(sendValue - receiveValue) > 10 && (
                  <p className="text-xs text-accent-gold mt-1">
                    {sendValue > receiveValue ? 'You may be giving up too much' : 'This looks like a good deal'}
                  </p>
                )}
              </div>
            </div>
            
            {/* You Receive */}
            <div className="bg-surface-100 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">You Receive</p>
              {receivePlayers.length === 0 ? (
                <p className="text-sm text-gray-600">No players selected</p>
              ) : (
                <div className="space-y-1">
                  {receivePlayers.map(id => {
                    const p = state.players[id]
                    return (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span>{p?.firstName} {p?.lastName}</span>
                        <span className={getRatingClass(p?.stats.overall || 0)}>
                          {p?.stats.overall}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={clearTrade} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              onClick={handlePropose} 
              disabled={!canPropose}
              className="btn btn-primary"
            >
              Propose Trade
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
