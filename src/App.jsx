import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useGameStore } from './store/gameStore'
import GamePage   from './pages/GamePage'
import WalletPage from './pages/WalletPage'
import { LiveBetsPage, MyBetsPage, ChatPage } from './pages/MobilePages'

// Auth is now a modal inside GamePage — no separate /auth route needed
function PrivateRoute({ children }) {
  const token = useGameStore(s => s.token)
  return token ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Game is PUBLIC — no login needed to watch */}
        <Route path="/"          element={<GamePage />} />
        <Route path="/livebets"  element={<LiveBetsPage />} />
        <Route path="/mybets"    element={<MyBetsPage />} />
        <Route path="/chat"      element={<ChatPage />} />

        {/* These still require login */}
        <Route path="/wallet"    element={<PrivateRoute><WalletPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
