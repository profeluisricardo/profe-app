import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import ListaAlumnos from './ListaAlumnos'
import EvaluacionesTrimestrales from './components/EvaluacionesTrimestrales'
import CapturaCalificaciones from './components/CapturaCalificaciones'
import ConfiguracionCriterios from './components/ConfiguracionCriterios'

export default function App() {
  const [grupos, setGrupos] = useState([])
  const [vistaActual, setVistaActual] = useState('menu') // 'menu', 'grado', 'grupo', 'evaluaciones', 'captura'
  const [gradoSeleccionado, setGradoSeleccionado] = useState(null)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(() => {
    const guardado = localStorage.getItem('grupo_activo')
    try {
      return guardado ? JSON.parse(guardado) : null
    } catch (e) {
      return null
    }
  })

  // Estados para modales
  const [modalGrupoAbierto, setModalGrupoAbierto] = useState(false)
  const [nombreGrupoInput, setNombreGrupoInput] = useState('')
  const [modalCriteriosAbierto, setModalCriteriosAbierto] = useState(false)

  useEffect(() => {
    if (grupoSeleccionado) {
      setVistaActual('grupo')
    }
    cargarGrupos()
  }, [])

  const cargarGrupos = async () => {
    const { data, error } = await supabase.from('grupos').select('*').order('grado').order('nombre')
    if (!error && data) {
      const gruposOrdenados = data.sort((a, b) => {
        const normA = a.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        const normB = b.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        
        const aTutoria = normA.includes('tutoria')
        const bTutoria = normB.includes('tutoria')
        
        if (aTutoria && !bTutoria) return 1
        if (!aTutoria && bTutoria) return -1
        return a.nombre.localeCompare(b.nombre)
      })

      const paletaColores = [
        '#059669', '#7c3aed', '#d97706', '#db2777', '#0d9488', '#4f46e5', '#dc2626'
      ]

      let colorIndex = 0
      const gruposConColor = gruposOrdenados.map(grupo => {
        const normNombre = grupo.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        const esTutoria = normNombre.includes('tutoria')
        const esGrupoE = normNombre.endsWith('e') || normNombre.includes(' e') || normNombre === 'e'
        
        let color
        if (esTutoria) {
          color = '#2563eb' 
        } else if (esGrupoE) {
          color = '#eab308' 
        } else {
          color = paletaColores[colorIndex % paletaColores.length]
          colorIndex++
        }
        
        return { ...grupo, colorFondo: color }
      })

      setGrupos(gruposConColor)
    }
  }

  const seleccionarGrado = (grado) => {
    setGradoSeleccionado(grado)
    setVistaActual('grado')
  }

  const seleccionarGrupo = (grupo) => {
    setGrupoSeleccionado(grupo)
    setVistaActual('grupo')
    localStorage.setItem('grupo_activo', JSON.stringify(grupo))
  }

  const volverAlMenu = () => {
    setGrupoSeleccionado(null)
    setGradoSeleccionado(null)
    setVistaActual('menu')
    localStorage.removeItem('grupo_activo')
  }

  const guardarNuevoGrupo = async (e) => {
    e.preventDefault()
    if (!nombreGrupoInput.trim()) return

    const { error } = await supabase.from('grupos').insert([{
      nombre: nombreGrupoInput.trim(),
      grado: gradoSeleccionado
    }])

    if (!error) {
      setNombreGrupoInput('')
      setModalGrupoAbierto(false)
      cargarGrupos()
    } else {
      alert('Error al crear grupo o tutoría: ' + error.message)
    }
  }

  // Vista de un grupo específico
  if (vistaActual === 'grupo' && grupoSeleccionado) {
    const esAmarillo = grupoSeleccionado.colorFondo === '#eab308'
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          backgroundColor: grupoSeleccionado.colorFondo || '#1e293b',
          color: esAmarillo ? '#000' : 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>📂 {grupoSeleccionado.nombre}</span>
          <button 
            onClick={volverAlMenu}
            style={{
              background: esAmarillo ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
              color: esAmarillo ? '#000' : 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ← Menú Principal
          </button>
        </div>

        <ListaAlumnos 
          grupoSeleccionado={grupoSeleccionado} 
          onCambiarGrupo={seleccionarGrupo}
          onVolver={volverAlMenu} 
        />
      </div>
    )
  }

  // Vista de Grupos y Tutorías por Grado
  if (vistaActual === 'grado' && gradoSeleccionado) {
    const gruposDelGrado = grupos.filter(g => g.grado === gradoSeleccionado)
    const nombreGrado = gradoSeleccionado === 1 ? '1er Grado' : gradoSeleccionado === 2 ? '2do Grado' : '3er Grado'

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button 
            onClick={volverAlMenu}
            style={{ background: '#334155', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ← Menú Principal
          </button>
          <h2 style={{ margin: 0, color: '#1e293b' }}>{nombreGrado}</h2>
          <button
            onClick={() => setModalGrupoAbierto(true)}
            style={{ background: '#059669', color: 'white', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ➕ Nuevo
          </button>
        </div>

        <p style={{ color: '#64748b' }}>Selecciona un grupo o tutoría para gestionar</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {gruposDelGrado.length > 0 ? (
            gruposDelGrado.map((grupo) => {
              const esAmarillo = grupo.colorFondo === '#eab308'
              return (
                <button
                  key={grupo.id}
                  onClick={() => seleccionarGrupo(grupo)}
                  style={{
                    padding: '1.5rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    background: grupo.colorFondo,
                    color: esAmarillo ? '#000' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {grupo.nombre}
                </button>
              )
            })
          ) : (
            <p style={{ gridColumn: '1 / -1', color: '#64748b', fontStyle: 'italic', padding: '2rem' }}>
              No hay grupos ni tutorías registrados para este grado todavía.
            </p>
          )}
        </div>

        {modalGrupoAbierto && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'left', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Agregar Grupo o Tutoría ({nombreGrado})</h3>
              <form onSubmit={guardarNuevoGrupo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.3rem' }}>
                    Nombre o Etiqueta (Ej. {gradoSeleccionado}° A - Tutoría):
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. 3° B - Tutoría"
                    value={nombreGrupoInput} 
                    onChange={(e) => setNombreGrupoInput(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => { setModalGrupoAbierto(false); setNombreGrupoInput(''); }}
                    style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    style={{ background: '#059669', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Vista de Evaluaciones
  if (vistaActual === 'evaluaciones') {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button 
            onClick={volverAlMenu}
            style={{ background: '#1b365d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ← Menú Principal
          </button>
        </div>
        <EvaluacionesTrimestrales />
      </div>
    )
  }

  // Vista de Captura de Calificaciones
  if (vistaActual === 'captura') {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button 
            onClick={volverAlMenu}
            style={{ background: '#1b365d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ← Menú Principal
          </button>
        </div>
        <CapturaCalificaciones />
      </div>
    )
  }

  // Menú Principal
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h2>Panel de administración escolar - Secundaria</h2>
      <p style={{ color: '#64748b' }}>Selecciona un Grado Escolar o Accede a Evaluaciones</p>

      <div style={{ margin: '1.5rem 0', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setVistaActual('evaluaciones')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            background: '#1b365d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          📊 Evaluaciones y Boletas
        </button>

        {/* Botón añadido para abrir la Configuración de Criterios directamente */}
        <button
          onClick={() => setModalCriteriosAbierto(true)}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            background: '#475569',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          ⚙️ Configurar Criterios Evaluativos
        </button>

        <button
          onClick={() => setVistaActual('captura')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            background: '#0284c7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          ✍️ Capturar Calificaciones
        </button>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '1.5rem 0' }} />

      <h3 style={{ color: '#334155', fontSize: '1.1rem' }}>Grados Escolares</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem', marginTop: '1rem', maxWidth: '400px', marginInline: 'auto' }}>
        <button
          onClick={() => seleccionarGrado(1)}
          style={{ padding: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          1er Grado
        </button>
        <button
          onClick={() => seleccionarGrado(2)}
          style={{ padding: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          2do Grado
        </button>
        <button
          onClick={() => seleccionarGrado(3)}
          style={{ padding: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          3er Grado
        </button>
      </div>

      {/* Modal flotante para Configuración de Criterios */}
      {modalCriteriosAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
          <ConfiguracionCriterios alCerrar={() => setModalCriteriosAbierto(false)} />
        </div>
      )}
    </div>
  )
}