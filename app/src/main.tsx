import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StylistsProvider } from './state/StylistsContext.tsx'
import { AdminAuthProvider } from './state/AdminAuthContext.tsx'
import { StylistAuthProvider } from './state/StylistAuthContext.tsx'
import './styles/broadsheet.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <StylistAuthProvider>
          <StylistsProvider>
            <App />
          </StylistsProvider>
        </StylistAuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
