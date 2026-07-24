export default function FormularioAlumno({
  modoImportacion,
  setModoImportacion,
  paterno, setPaterno,
  materno, setMaterno,
  nombres, setNombres,
  telefono, setTelefono,
  nombreTutor, setNombreTutor,
  whatsappTutor, setWhatsappTutor,
  agregarAlumno,
  textoMasivo, setTextoMasivo,
  importarListaMasiva
}) {
  return (
    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>
          {modoImportacion ? '📥 Importar Lista Masiva (Pegar texto)' : '➕ Registrar Nuevo Alumno'}
        </h3>
        <button 
          type="button" 
          onClick={() => setModoImportacion(!modoImportacion)}
          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', textDecoration: 'underline' }}
        >
          {modoImportacion ? '← Registro Manual Individual' : '🔄 Cambiar a Importación Masiva'}
        </button>
      </div>

      {modoImportacion ? (
        <div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
            Pega tu lista de alumnos (un nombre por línea). El sistema limpiará números automáticos si los tienen.
          </p>
          <textarea 
            rows="5"
            value={textoMasivo}
            onChange={(e) => setTextoMasivo(e.target.value)}
            placeholder="1. PEREZ GOMEZ JUAN&#10;2. LOPEZ MARIA..."
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '0.75rem', fontSize: '0.9rem', fontFamily: 'inherit' }}
          />
          <button 
            onClick={importarListaMasiva}
            style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            Procesar e Importar Lista
          </button>
        </div>
      ) : (
        <form onSubmit={agregarAlumno}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#475569' }}>Apellido Paterno *</label>
              <input 
                type="text" 
                value={paterno} 
                onChange={(e) => setPaterno(e.target.value)} 
                placeholder="Ej. PEREZ"
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#475569' }}>Apellido Materno</label>
              <input 
                type="text" 
                value={materno} 
                onChange={(e) => setMaterno(e.target.value)} 
                placeholder="Ej. GOMEZ"
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#475569' }}>Nombre(s) *</label>
              <input 
                type="text" 
                value={nombres} 
                onChange={(e) => setNombres(e.target.value)} 
                placeholder="Ej. JUAN CARLOS"
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#475569' }}>Teléfono Alumno</label>
              <input 
                type="text" 
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
                placeholder="10 dígitos"
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#475569' }}>Nombre del Tutor</label>
              <input 
                type="text" 
                value={nombreTutor} 
                onChange={(e) => setNombreTutor(e.target.value)} 
                placeholder="Nombre del tutor"
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#475569' }}>WhatsApp Tutor</label>
              <input 
                type="text" 
                value={whatsappTutor} 
                onChange={(e) => setWhatsappTutor(e.target.value)} 
                placeholder="10 dígitos"
                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            💾 Guardar Alumno
          </button>
        </form>
      )}
    </div>
  )
}