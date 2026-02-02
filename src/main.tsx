import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize Eruda for better debugging in development (visible to AI agents)
if (import.meta.env.DEV) {
  import('eruda').then((eruda) => eruda.default.init());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
