import { useState, useEffect } from 'react'

export default function BotonInstalar() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    window.addEventListener('appinstalled', () => {
      setVisible(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA')
    }

    setDeferredPrompt(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
      color: 'white',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      margin: '0.5rem 0',
      border: '1px solid #334155',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>📱</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Instala la Aplicación</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Accede más rápido y úsala como aplicación independiente en tu dispositivo.</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={handleInstallClick}
          style={{
            padding: '0.4rem 0.8rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap'
          }}
        >
          Instalar Ahora
        </button>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0.2rem'
          }}
          title="Cerrar aviso"
        >
          ✕
        </button>
      </div>
    </div>
  )
}