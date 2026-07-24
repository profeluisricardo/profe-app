export default function ModalAlumno({ alumno, grupoNombre, onClose, onCambiarFoto, subiendoFotoId, onDescargarReporte }) {
  if (!alumno) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        background: 'white', padding: '1.5rem', borderRadius: '8px', width: '100%', maxWidth: '500px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none',
            fontSize: '1.2rem', cursor: 'pointer', color: '#64748b'
          }}
        >
          ✕
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            {alumno.foto_url ? (
              <img src={alumno.foto_url} alt="Foto" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1' }} />
            ) : (
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#64748b' }}>Sin foto</div>
            )}
            <label style={{
              position: 'absolute', bottom: 0, right: 0, background: '#2563eb', color: 'white',
              borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', fontSize: '0.7rem'
            }}>
              {subiendoFotoId === alumno.id ? '...' : '📸'}
              <input type="file" accept="image/*" capture="environment" onChange={(e) => onCambiarFoto(e, alumno.id)} style={{ display: 'none' }} />
            </label>
          </div>
          <div>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#2563eb', fontWeight: 'bold' }}>{alumno.id_corto}</span>
            <h3 style={{ margin: '0.2rem 0', color: '#1e293b', fontSize: '1.1rem' }}>{alumno.nombre_completo}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Grupo: {grupoNombre}</p>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}><strong>Teléfono Alumno:</strong> {alumno.telefono || 'No registrado'}</p>
          <p style={{ margin: '0 0 0.5rem 0' }}><strong>Tutor:</strong> {alumno.nombre_tutor || 'No registrado'}</p>
          {alumno.whatsapp_tutor && (
            <p style={{ margin: 0 }}>
              <strong>WhatsApp Tutor:</strong>{' '}
              <a href={`https://wa.me/52${alumno.whatsapp_tutor.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontWeight: 'bold', textDecoration: 'none' }}>
                💬 {alumno.whatsapp_tutor}
              </a>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => onDescargarReporte(alumno)} 
            style={{ padding: '0.5rem 1rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            📄 Reporte PDF Individual
          </button>
          <button 
            onClick={onClose} 
            style={{ padding: '0.5rem 1rem', background: '#cbd5e1', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}