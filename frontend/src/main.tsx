import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.tsx'

function Auth0ProviderWithNavigate({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN ?? 'your-tenant.auth0.com'}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID ?? 'your_client_id'}
      authorizationParams={{ redirect_uri: window.location.origin + '/callback' }}
      onRedirectCallback={(appState) => {
        console.log('[Auth0] onRedirectCallback fired, appState:', appState)
        navigate(appState?.returnTo ?? '/chat')
      }}
    >
      {children}
    </Auth0Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <App />
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </StrictMode>,
)
