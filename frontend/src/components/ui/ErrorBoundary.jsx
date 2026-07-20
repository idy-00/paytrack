import { Component } from 'react'
import { RefreshCw, Home } from 'lucide-react'
import Logo from './Logo'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('PayTrack ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-dvh bg-surface-base flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-brand-bord/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Receipt size={28} className="text-brand-bord" />
          </div>
          <h1 className="font-brand text-[24px] text-brand-ink mb-2">
            Une erreur est survenue
          </h1>
          <p className="text-[14px] text-text-secondary font-body mb-8 leading-relaxed">
            Quelque chose s'est mal passé. Rechargez la page ou retournez à l'accueil.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary gap-2"
            >
              <RefreshCw size={15} /> Recharger
            </button>
            <button
              onClick={() => { window.location.href = '/' }}
              className="btn-secondary gap-2"
            >
              <Home size={15} /> Accueil
            </button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 text-left bg-surface-card rounded-xl p-4">
              <summary className="text-[12px] text-text-muted cursor-pointer font-ui">
                Détails de l'erreur (dev)
              </summary>
              <pre className="text-[11px] text-brand-bord mt-2 overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}
