import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import ExecutionsPage from './pages/ExecutionsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:workflowId" element={<EditorPage />} />
        <Route path="/executions" element={<ExecutionsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
