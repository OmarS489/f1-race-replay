import { Routes, Route } from 'react-router-dom'
import SelectionPage from './pages/SelectionPage'
import RaceViewer from './pages/RaceViewer'
import QualifyingViewer from './pages/QualifyingViewer'

function App() {
  return (
    <div className="min-h-screen bg-f1-black">
      <Routes>
        <Route path="/" element={<SelectionPage />} />
        <Route path="/race/:year/:round/:session" element={<RaceViewer />} />
        <Route path="/qualifying/:year/:round/:session" element={<QualifyingViewer />} />
      </Routes>
    </div>
  )
}

export default App
