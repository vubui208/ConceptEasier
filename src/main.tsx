import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ConceptEasier from './ConceptEasier.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConceptEasier />
  </StrictMode>,
)
