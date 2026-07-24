import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

export default function CalendarioTrimestral({ grupoSeleccionado, onVolver }) {
  const [tareas, setTareas] = useState([])
  const [periodoActivo, setPeriodoActivo] = useState(1)

  useEffect(() => {
    cargarTareas()
  }, [grupoSeleccionado])

  const cargarTareas = async () => {
    const { data, error } = await supabase
      .from('trabajos')
      .select('*')
      .eq('grupo_id', grupoSeleccionado.id)
      .order('fecha_asignacion', { ascending: true })

    if (!error && data) {
      setTareas(data)
    }
  }

  const tareasFiltradas = tareas.filter(t => t.periodo_id === periodoActivo)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={onVolver} style={{ padding: '0.4rem 0.8rem', background: '#cbd5e1', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Volver a Alumnos
        </button>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Calendario Trimestral - {grupoSeleccionado.nombre}</h2>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { id: 1, label: 'Periodo 1 (Noviembre)' },
          { id: 2, label: 'Periodo 2 (Marzo)' },
          { id: 3, label: 'Periodo 3 (Julio)' }
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodoActivo(p.id)}
            style={{
              flex: 1,
              padding: '0.6rem',
              background: periodoActivo === p.id ? '#8b5cf6' : '#e2e8f0',
              color: periodoActivo === p.id ? 'white' : '#1e293b',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Actividades del Periodo {periodoActivo}</h3>
        {tareasFiltradas.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay actividades registradas en este periodo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tareasFiltradas.map((t) => (
              <div key={t.id} style={{ borderLeft: '4px solid #8b5cf6', background: '#f8fafc', padding: '0.75rem', borderRadius: '0 6px 6px 0' }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{t.titulo}</div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>{t.descripcion}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                  📅 Fecha asignada: {t.fecha_asignacion}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}