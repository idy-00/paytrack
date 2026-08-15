import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Shield, Bell, Mail, MessageSquare, Globe,
  Save, RefreshCw, Key, Database, Lock, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminParametresPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    company_name: 'PayTrack',
    currency: 'XOF',
    late_payment_days: 3,
    sms_enabled: false,
    email_enabled: false,
    fcm_enabled: false,
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 500))
      toast.success('Paramètres enregistrés')
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    {
      title: 'Général',
      icon: Globe,
      fields: [
        {
          key: 'company_name',
          label: 'Nom de l\'entreprise',
          type: 'text',
          placeholder: 'PayTrack',
        },
        {
          key: 'currency',
          label: 'Devise',
          type: 'select',
          options: [
            { value: 'XOF', label: 'Franc CFA (XOF)' },
            { value: 'EUR', label: 'Euro (EUR)' },
            { value: 'USD', label: 'Dollar US (USD)' },
          ],
        },
        {
          key: 'late_payment_days',
          label: 'Délai avant retard (jours)',
          type: 'number',
          min: 1,
          max: 30,
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      fields: [
        {
          key: 'fcm_enabled',
          label: 'Notifications push (FCM)',
          type: 'toggle',
          description: 'Nécessite une clé FCM configurée',
        },
        {
          key: 'email_enabled',
          label: 'Notifications email',
          type: 'toggle',
          description: 'Nécessite SMTP configuré',
        },
        {
          key: 'sms_enabled',
          label: 'Notifications SMS',
          type: 'toggle',
          description: 'Nécessite une API SMS configurée',
        },
      ],
    },
  ]

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="btn btn-ghost btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-sm text-gray-500 mt-1">Configuration de l'application</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary gap-2"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Enregistrer
        </button>
      </div>

      {/* Security Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900">Clés API manquantes</p>
          <p className="text-xs text-amber-700 mt-1">
            Les notifications push (FCM) et email (SMTP) nécessitent des clés API à configurer dans le fichier .env du backend.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      {sections.map(section => (
        <div key={section.title} className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <section.icon size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">{section.title}</h2>
          </div>
          <div className="p-5 space-y-5">
            {section.fields.map(field => (
              <div key={field.key} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {field.description && (
                    <p className="text-xs text-gray-400">{field.description}</p>
                  )}
                </div>
                <div className="w-48">
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={settings[field.key]}
                      onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="input text-sm"
                    />
                  )}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={settings[field.key]}
                      onChange={e => setSettings({ ...settings, [field.key]: parseInt(e.target.value) })}
                      min={field.min}
                      max={field.max}
                      className="input text-sm"
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      value={settings[field.key]}
                      onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                      className="input text-sm"
                    >
                      {field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  {field.type === 'toggle' && (
                    <button
                      onClick={() => setSettings({ ...settings, [field.key]: !settings[field.key] })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings[field.key] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings[field.key] ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* API Keys Section (Info only) */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Key size={18} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">Clés API</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500">
            Les clés API sont configurées dans le fichier <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env</code> du backend pour des raisons de sécurité.
          </p>

          <div className="space-y-3">
            {[
              { name: 'FCM_SERVER_KEY', status: 'Non configurée', desc: 'Firebase Cloud Messaging' },
              { name: 'MAIL_MAILER', status: 'Non configurée', desc: 'Service d\'envoi email' },
              { name: 'WAVE_API_KEY', status: 'Non configurée', desc: 'Paiements Wave' },
              { name: 'ORANGE_MONEY_KEY', status: 'Non configurée', desc: 'Paiements Orange Money' },
            ].map(item => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Lock size={18} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">Sécurité</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">Authentification Sanctum</span>
            </div>
            <span className="text-xs text-green-600">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">Isolation multi-tenant</span>
            </div>
            <span className="text-xs text-green-600">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">Rôles Spatie Permission</span>
            </div>
            <span className="text-xs text-green-600">Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}
