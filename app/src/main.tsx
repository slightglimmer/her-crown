import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClaimsProvider } from './state/ClaimsContext.tsx'
import { AdminAuthProvider } from './state/AdminAuthContext.tsx'
import './styles/broadsheet.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <ClaimsProvider>
          <App />
        </ClaimsProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
