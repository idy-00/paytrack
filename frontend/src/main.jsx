import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: '14px',
            background: '#0F2744',
            color: '#F9FAFB',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#16A34A', secondary: '#F9FAFB' },
          },
          error: {
            iconTheme: { primary: '#DC2626', secondary: '#F9FAFB' },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
