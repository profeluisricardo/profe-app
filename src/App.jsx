import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import ListaAlumnos from './ListaAlumnos'

export default function App() {
  const [grupos, setGrupos] = useState([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(() => {
    const guardado = localStorage.getItem('grupo_activo')
    try {
      return guardado ? JSON.parse(guardado) : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    cargarGrupos()
  }, [])

  const cargarGrupos = async () => {
    const { data, error } = await supabase.from('grupos').select('*')
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

      // Paleta de colores distintos
      const paletaColores = [
        '#059669', // Verde esmeralda
        '#7c3aed', // Púrpura
        '#d97706', // Naranja / Ámbar
        '#db2777', // Rosa / Fucsia
        '#0d9488', // Verde azulado (Teal)
        '#4f46e5', // Índigo
        '#dc2626'  // Rojo
      ]

      let colorIndex = 0
      const gruposConColor = gruposOrdenados.map(grupo => {
        const normNombre = grupo.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        const esTutoria = normNombre.includes('tutoria')
        const esGrupoE = normNombre.endsWith('e') || normNombre.includes(' e') || normNombre === 'e'
        
        let color
        if (esTutoria) {
          color = '#2563eb' // Azul fijo para tutoría
        } else if (esGrupoE) {
          color = '#eab308' // Amarillo fijo para el grupo E
        } else {
          color = paletaColores[colorIndex % paletaColores.length]
          colorIndex++
        }
        
        return {
          ...grupo,
          colorFondo: color
        }
      })

      setGrupos(gruposConColor)
    }
  }

  const seleccionarGrupo = (grupo) => {
    setGrupoSeleccionado(grupo)
    localStorage.setItem('grupo_activo', JSON.stringify(grupo))
  }

  const volverAlMenu = () => {
    setGrupoSeleccionado(null)
    localStorage.removeItem('grupo_activo')
  }

  if (grupoSeleccionado) {
    const esAmarillo = grupoSeleccionado.colorFondo === '#eab308'
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' }}>
        {/* Barra superior con el color combinado del grupo activo */}
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

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h2>Panel de administración escolar - Secundaria</h2>
      <p style={{ color: '#64748b' }}>Selecciona un Grupo</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {grupos.map((grupo) => {
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
        })}
      </div>
    </div>
  )
}