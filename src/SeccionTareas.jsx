import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

export default function SeccionTareas({ grupoSeleccionado, onVolver }) {
  const [tareas, setTareas] = useState([])
  const [todosLosGrupos, setTodosLosGrupos] = useState([])
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [periodoId, setPeriodoId] = useState('1')
  const [fechaAsignacion, setFechaAsignacion] = useState(new Date().toISOString().split('T')[0])
  const [aplicarTodos, setAplicarTodos] = useState(true)

  useEffect(() => {
    cargarTareas()
    cargarGrupos()
  }, [grupoSeleccionado])

  const cargarGrupos = async () => {
    const { data } = await supabase.from('grupos').select('*').order('nombre')
    if (data) setTodosLosGrupos(data)
  }

  const cargarTareas = async () => {
    const { data, error } = await supabase
      .from('trabajos')
      .select('*')
      .eq('grupo_id', grupoSeleccionado.id)
      .order('fecha_asignacion', { ascending: false })

    if (!error) {
      setTareas(data || [])
    }
  }

  const agregarTarea = async (e) => {
    e.preventDefault()
    if (!titulo.trim()) return alert('El título de la tarea es obligatorio.')

    if (aplicarTodos && todosLosGrupos.length > 0) {
      const nuevasTareas = todosLosGrupos.map(g => ({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        periodo_id: parseInt(periodoId),
        fecha_asignacion: fechaAsignacion,
        grupo_id: g.id
      }))

      const { error } = await supabase.from('trabajos').insert(nuevasTareas)
      if (error) {
        alert('Error al guardar tareas: ' + error.message)
      } else {
        setTitulo('')
        setDescripcion('')
        cargarTareas()
        alert('¡Tarea asignada correctamente a todos los grupos!')
      }
    } else {
      const { error } = await supabase.from('trabajos').insert([
        {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          periodo_id: parseInt(periodoId),
          fecha_asignacion: fechaAsignacion,
          grupo_id: grupoSeleccionado.id
        }
      ])

      if (error) {
        alert('Error al guardar tarea: ' + error.message)
      } else {
        setTitulo('')
        setDescripcion('')
        cargarTareas()
      }
    }
  }

  const eliminarTarea = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return
    const { error } = await supabase.from('trabajos').delete().eq('id', id)
    if (!error) cargarTareas()
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={onVolver} style={{ padding: '0.4rem 0.8rem', background: '#cbd5e1', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Volver a Alumnos
        </button>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Gestión de Tareas - {grupoSeleccionado.nombre}</h2>
      </div>

      <form onSubmit={agregarTarea} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Nueva Tarea / Actividad</h3>
        <input
          type="text"
          placeholder="Título de la tarea"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        />
        <textarea
          placeholder="Descripción o instrucciones..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows="3"
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'sans-serif' }}
        />
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>Periodo de Evaluación:</label>
            <select value={periodoId} onChange={(e) => setPeriodoId(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              <option value="1">Periodo 1 (Noviembre)</option>
              <option value="2">Periodo 2 (Marzo)</option>
              <option value="3">Periodo 3 (Julio)</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>Fecha de Asignación:</label>
            <input
              type="date"
              value={fechaAsignacion}
              onChange={(e) => setFechaAsignacion(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#e2e8f0', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
          <input
            type="checkbox"
            id="chkTodos"
            checked={aplicarTodos}
            onChange={(e) => setAplicarTodos(e.target.checked)}
            style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
          />
          <label htmlFor="chkTodos" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', cursor: 'pointer' }}>
            Asignar automáticamente a TODOS los grupos (A al F)
          </label>
        </div>

        <button type="submit" style={{ padding: '0.6rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
          Registrar Tarea
        </button>
      </form>

      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Tareas Registradas en este Grupo</h3>
        {tareas.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay tareas registradas para este grupo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tareas.map((t) => (
              <div key={t.id} style={{ border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '6px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1e293b' }}>{t.titulo}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>{t.descripcion}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', display: 'flex', gap: '1rem' }}>
                    <span>📅 {t.fecha_asignacion}</span>
                    <span>🎯 Periodo {t.periodo_id}</span>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => eliminarTarea(t.id)}
                    style={{ padding: '0.3rem 0.6rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}