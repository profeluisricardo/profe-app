import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import SeccionTareas from './SeccionTareas'
import CalendarioTrimestral from './CalendarioTrimestral'
import BotonInstalar from './BotonInstalar'

export default function ListaAlumnos({ grupoSeleccionado, onCambiarGrupo, onVolver }) {
  const [todosLosGrupos, setTodosLosGrupos] = useState([])
  const [vistaSecundaria, setVistaSecundaria] = useState(null) // 'tareas' | 'calendario' | 'asistencias' | null

  const [alumnos, setAlumnos] = useState([])
  const [paterno, setPaterno] = useState('')
  const [materno, setMaterno] = useState('')
  const [nombres, setNombres] = useState('')
  
  const [telefono, setTelefono] = useState('')
  const [nombreTutor, setNombreTutor] = useState('')
  const [whatsappTutor, setWhatsappTutor] = useState('')

  const [textoMasivo, setTextoMasivo] = useState('')
  const [modoImportacion, setModoImportacion] = useState(false)
  const [subiendoFotoId, setSubiendoFotoId] = useState(null)
  const [alumnoSeleccionadoModal, setAlumnoSeleccionadoModal] = useState(null)

  // Estados para Asistencias y Materiales
  const [fechaAsistencia, setFechaAsistencia] = useState(new Date().toISOString().split('T')[0])
  const [asistenciasDia, setAsistenciasDia] = useState({})
  const [materialesDia, setMaterialesDia] = useState({}) // NUEVO: Estado para flauta y materiales
  const [historialAsistencias, setHistorialAsistencias] = useState({})
  const [verCompletadosAsistencia, setVerCompletadosAsistencia] = useState(false)

  useEffect(() => {
    if (grupoSeleccionado) {
      obtenerAlumnos()
      cargarTodosLosGrupos()
    }
  }, [grupoSeleccionado])

  useEffect(() => {
    if (vistaSecundaria === 'asistencias' && grupoSeleccionado) {
      cargarAsistenciasDia(fechaAsistencia)
      cargarMaterialesDia(fechaAsistencia) // NUEVO: Cargar materiales del día
      cargarHistorialAsistencias()
    }
  }, [fechaAsistencia, alumnos, vistaSecundaria, grupoSeleccionado])

  const cargarTodosLosGrupos = async () => {
    const { data } = await supabase.from('grupos').select('*')
    if (data) {
      const ordenados = data.sort((a, b) => {
        const normA = a.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        const normB = b.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        
        const aTutoria = normA.includes('tutoria')
        const bTutoria = normB.includes('tutoria')
        
        if (aTutoria && !bTutoria) return 1
        if (!aTutoria && bTutoria) return -1
        return a.nombre.localeCompare(b.nombre)
      })
      setTodosLosGrupos(ordenados)
    }
  }

  const obtenerAlumnos = async () => {
    if (!grupoSeleccionado) return
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('grupo_id', grupoSeleccionado.id)
      .order('nombre_completo')

    if (error) console.error('Error al cargar alumnos:', error)
    else setAlumnos(data || [])
  }

  // Lógica de Asistencias
  const cargarAsistenciasDia = async (fecha) => {
    const alumnoIds = alumnos.map(a => a.id)
    if (alumnoIds.length === 0) return

    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .eq('fecha', fecha)
      .in('alumno_id', alumnoIds)

    if (!error && data) {
      const mapa = {}
      data.forEach(item => {
        mapa[item.alumno_id] = item.estatus
      })
      setAsistenciasDia(mapa)
    }
  }

  // NUEVO: Lógica para cargar materiales del día
  const cargarMaterialesDia = async (fecha) => {
    const alumnoIds = alumnos.map(a => a.id)
    if (alumnoIds.length === 0) return

    const { data, error } = await supabase
      .from('materiales_asistencia')
      .select('*')
      .eq('fecha', fecha)
      .in('alumno_id', alumnoIds)

    if (!error && data) {
      const mapa = {}
      data.forEach(item => {
        mapa[item.alumno_id] = { flauta: item.flauta, cuaderno: item.cuaderno }
      })
      setMaterialesDia(mapa)
    }
  }

  const cargarHistorialAsistencias = async () => {
    const alumnoIds = alumnos.map(a => a.id)
    if (alumnoIds.length === 0) return

    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .in('alumno_id', alumnoIds)
      .order('fecha', { ascending: false })

    if (!error && data) {
      const mapa = {}
      data.forEach(item => {
        if (!mapa[item.alumno_id]) mapa[item.alumno_id] = []
        if (!mapa[item.alumno_id].some(r => r.fecha === item.fecha)) {
          mapa[item.alumno_id].push(item)
        }
      })
      setHistorialAsistencias(mapa)
    }
  }

  const cambiarAsistencia = async (alumnoId, estatus) => {
    setAsistenciasDia(prev => ({ ...prev, [alumnoId]: estatus }))

    const { data: existente } = await supabase
      .from('asistencias')
      .select('id')
      .eq('alumno_id', alumnoId)
      .eq('fecha', fechaAsistencia)
      .maybeSingle()

    if (existente) {
      await supabase
        .from('asistencias')
        .update({ estatus })
        .eq('id', existente.id)
    } else {
      await supabase
        .from('asistencias')
        .insert([{ alumno_id: alumnoId, grupo_id: grupoSeleccionado.id, fecha: fechaAsistencia, estatus }])
    }

    setTimeout(() => {
      cargarHistorialAsistencias()
    }, 250)
  }

  // NUEVO: Función para alternar estatus de materiales / flauta
  const cambiarMaterial = async (alumnoId, tipoMaterial) => {
    const actualMat = materialesDia[alumnoId] || { flauta: false, cuaderno: false }
    const nuevoValor = !actualMat[tipoMaterial]
    
    const actualizado = { ...actualMat, [tipoMaterial]: nuevoValor }
    setMaterialesDia(prev => ({ ...prev, [alumnoId]: actualizado }))

    const { data: existente } = await supabase
      .from('materiales_asistencia')
      .select('id')
      .eq('alumno_id', alumnoId)
      .eq('fecha', fechaAsistencia)
      .maybeSingle()

    if (existente) {
      await supabase
        .from('materiales_asistencia')
        .update({ [tipoMaterial]: nuevoValor })
        .eq('id', existente.id)
    } else {
      await supabase
        .from('materiales_asistencia')
        .insert([{ 
          alumno_id: alumnoId, 
          grupo_id: grupoSeleccionado.id, 
          fecha: fechaAsistencia, 
          flauta: tipoMaterial === 'flauta' ? nuevoValor : false,
          cuaderno: tipoMaterial === 'cuaderno' ? nuevoValor : false
        }])
    }
  }

  const agregarAlumno = async (e) => {
    e.preventDefault()
    if (!paterno || !nombres) {
      return alert('Por favor llena al menos el Apellido Paterno y el Nombre.')
    }

    const nombreCompletoOficial = `${paterno.trim()} ${materno.trim()} ${nombres.trim()}`.replace(/\s+/g, ' ').toUpperCase()
    const numeroConsecutivo = String(alumnos.length + 1).padStart(2, '0')
    const prefijoGrupo = grupoSeleccionado.nombre.replace(/[^0-9A-Z]/gi, '').toUpperCase()
    
    const inicialP = paterno.trim().charAt(0)
    const inicialN = nombres.trim().charAt(0)
    const idCortoAuto = `${prefijoGrupo}-${numeroConsecutivo}-${inicialP}${inicialN}`

    const { error } = await supabase
      .from('alumnos')
      .insert([
        { 
          nombre_completo: nombreCompletoOficial, 
          id_corto: idCortoAuto, 
          grupo_id: grupoSeleccionado.id,
          telefono: telefono.trim(),
          nombre_tutor: nombreTutor.trim().toUpperCase(),
          whatsapp_tutor: whatsappTutor.trim()
        }
      ])

    if (error) {
      alert('Error al registrar alumno: ' + error.message)
    } else {
      setPaterno('')
      setMaterno('')
      setNombres('')
      setTelefono('')
      setNombreTutor('')
      setWhatsappTutor('')
      obtenerAlumnos()
    }
  }

  const importarListaMasiva = async () => {
    if (!textoMasivo.trim()) return alert('Pega el texto de la lista primero.')

    const lineas = textoMasivo.split('\n')
    const nuevosAlumnosData = []
    let contadorActual = alumnos.length + 1

    for (let i = 0; i < lineas.length; i++) {
      let linea = lineas[i].trim()
      if (!linea) continue

      linea = linea.replace(/^\d+[\.\)]?\s*/, '').trim()
      if (!linea) continue

      const nombreMayus = linea.toUpperCase().replace(/\s+/g, ' ')
      const numeroStr = String(contadorActual + i).padStart(2, '0')
      const prefijoGrupo = grupoSeleccionado.nombre.replace(/[^0-9A-Z]/gi, '').toUpperCase()
      const idCortoAuto = `${prefijoGrupo}-${numeroStr}-PR`

      nuevosAlumnosData.push({
        nombre_completo: nombreMayus,
        id_corto: idCortoAuto,
        grupo_id: grupoSeleccionado.id
      })
    }

    if (nuevosAlumnosData.length === 0) return alert('No se encontraron nombres válidos para importar.')

    const { error } = await supabase.from('alumnos').insert(nuevosAlumnosData)

    if (error) {
      alert('Error al importar: ' + error.message)
    } else {
      setTextoMasivo('')
      setModoImportacion(false)
      obtenerAlumnos()
      alert('¡Lista importada correctamente!')
    }
  }

  const procesarFotoBase64 = (archivoOriginal) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(archivoOriginal)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const anchoMaximo = 600
          let ancho = img.width
          let alto = img.height

          if (ancho > anchoMaximo) {
            alto = Math.round((alto * anchoMaximo) / ancho)
            ancho = anchoMaximo
          }

          canvas.width = ancho
          canvas.height = alto
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, ancho, alto)

          const base64Data = canvas.toDataURL('image/jpeg', 0.8)
          resolve(base64Data)
        }
      }
    })
  }

  const manejarCapturaFoto = async (e, alumnoId) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    setSubiendoFotoId(alumnoId)
    try {
      const fotoBase64 = await procesarFotoBase64(archivo)
      const { error: errorUpdate } = await supabase
        .from('alumnos')
        .update({ foto_url: fotoBase64 })
        .eq('id', alumnoId)

      if (errorUpdate) {
        alert('Error al guardar foto: ' + errorUpdate.message)
      } else {
        await obtenerAlumnos()
        const alumnoActualizado = alumnos.find(a => a.id === alumnoId)
        if (alumnoActualizado && alumnoSeleccionadoModal?.id === alumnoId) {
          setAlumnoSeleccionadoModal({ ...alumnoActualizado, foto_url: fotoBase64 })
        }
      }
    } catch (err) {
      console.error(err)
      alert('Error al procesar la imagen.')
    }
    setSubiendoFotoId(null)
  }

  // Generar Reporte PDF Individual del Alumno
  const descargarReportePDF = async (alumno) => {
    try {
      const { data: tareasData } = await supabase
        .from('tareas')
        .select('*')
        .eq('grupo_id', grupoSeleccionado.id)

      const { data: entregasData } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('alumno_id', alumno.id)

      const { data: asistenciasData } = await supabase
        .from('asistencias')
        .select('*')
        .eq('alumno_id', alumno.id)
        .order('fecha', { ascending: false })

      const tareasCompletadasIds = new Set(
        (entregasData || []).filter(e => e.estatus === 'completado' || e.entregado).map(e => e.tarea_id)
      )

      const tareasCumplidasLista = (tareasData || []).filter(t => tareasCompletadasIds.has(t.id))
      const tareasFaltantesLista = (tareasData || []).filter(t => !tareasCompletadasIds.has(t.id))

      const totalAsistencias = (asistenciasData || []).filter(a => a.estatus === 'asistencia' || a.presente).length
      const totalFaltas = (asistenciasData || []).filter(a => a.estatus === 'falta' || a.falta).length
      const totalRetardos = (asistenciasData || []).filter(a => a.estatus === 'retardo').length
      const totalJustificantes = (asistenciasData || []).filter(a => a.estatus === 'justificante').length

      const ventanaPrint = window.open('', '_blank')
      ventanaPrint.document.write(`
        <html>
          <head>
            <title>Reporte - ${alumno.nombre_completo}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 2rem; color: #1e293b; max-width: 800px; margin: 0 auto; }
              h1, h2, h3 { margin: 0 0 0.5rem 0; color: #0f172a; }
              .header { display: flex; align-items: center; gap: 1.5rem; border-bottom: 2px solid #cbd5e1; padding-bottom: 1rem; margin-bottom: 1.5rem; }
              .foto { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 2px solid #94a3b8; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: 8px; font-size: 0.9rem; }
              .seccion { margin-bottom: 1.5rem; }
              table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.9rem; }
              th, td { border: 1px solid #cbd5e1; padding: 0.5rem; text-align: left; }
              th { background: #f1f5f9; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              ${alumno.foto_url ? `<img src="${alumno.foto_url}" class="foto" />` : `<div class="foto" style="background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:0.7rem;">Sin Foto</div>`}
              <div>
                <h1>${alumno.nombre_completo}</h1>
                <p><strong>ID Corto:</strong> ${alumno.id_corto} | <strong>Grupo:</strong> ${grupoSeleccionado.nombre}</p>
                <p><strong>Tutor:</strong> ${alumno.nombre_tutor || 'N/A'} (${alumno.whatsapp_tutor || 'Sin WhatsApp'})</p>
              </div>
            </div>

            <div class="info-grid">
              <div><strong>Teléfono Alumno:</strong> ${alumno.telefono || 'N/A'}</div>
              <div><strong>Total Asistencias:</strong> ${totalAsistencias}</div>
              <div><strong>Total Faltas:</strong> ${totalFaltas}</div>
              <div><strong>Total Retardos:</strong> ${totalRetardos}</div>
              <div><strong>Total Justificantes:</strong> ${totalJustificantes}</div>
            </div>

            <div class="seccion">
              <h2>Tareas Cumplidas (${tareasCumplidasLista.length})</h2>
              ${tareasCumplidasLista.length > 0 ? `
                <table>
                  <tr><th>Título de Tarea</th><th>Descripción</th></tr>
                  ${tareasCumplidasLista.map(t => `<tr><td><strong>${t.titulo || t.nombre}</strong></td><td>${t.descripcion || 'N/A'}</td></tr>`).join('')}
                </table>
              ` : '<p style="font-style:italic;color:#64748b;">No registra tareas cumplidas aún.</p>'}
            </div>

            <div class="seccion">
              <h2>Tareas Faltantes / Pendientes (${tareasFaltantesLista.length})</h2>
              ${tareasFaltantesLista.length > 0 ? `
                <table>
                  <tr><th>Título de Tarea</th><th>Descripción</th></tr>
                  ${tareasFaltantesLista.map(t => `<tr><td><strong>${t.titulo || t.nombre}</strong></td><td>${t.descripcion || 'N/A'}</td></tr>`).join('')}
                </table>
              ` : '<p style="font-style:italic;color:#16a34a;">¡Excelente! No tiene tareas pendientes.</p>'}
            </div>

            <div style="text-align: center; margin-top: 2rem;">
              <button onclick="window.print()" style="padding: 0.8rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1rem;">Guardar como PDF / Imprimir</button>
            </div>
          </body>
        </html>
      `)
      ventanaPrint.document.close()
    } catch (err) {
      console.error(err)
      alert('Error al generar el reporte PDF.')
    }
  }

  // Generar Reporte PDF Consolidado del Grupo
  const descargarReporteGrupoPDF = async () => {
    try {
      const { data: tareasData } = await supabase
        .from('tareas')
        .select('*')
        .eq('grupo_id', grupoSeleccionado.id)

      const alumnoIds = alumnos.map(a => a.id)
      let entregasData = []
      let asistenciasData = []

      if (alumnoIds.length > 0) {
        const { data: ent } = await supabase
          .from('calificaciones')
          .select('*')
          .in('alumno_id', alumnoIds)
        entregasData = ent || []

        const { data: asis } = await supabase
          .from('asistencias')
          .select('*')
          .in('alumno_id', alumnoIds)
        asistenciasData = asis || []
      }

      const ventanaPrint = window.open('', '_blank')
      ventanaPrint.document.write(`
        <html>
          <head>
            <title>Reporte Grupal - ${grupoSeleccionado.nombre}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 1.5rem; color: #1e293b; max-width: 1000px; margin: 0 auto; }
              h1, h2, h3 { margin: 0 0 0.5rem 0; color: #0f172a; }
              .header { border-bottom: 2px solid #cbd5e1; padding-bottom: 1rem; margin-bottom: 1.5rem; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.8rem; }
              th, td { border: 1px solid #cbd5e1; padding: 0.4rem; text-align: left; }
              th { background: #f1f5f9; }
              .text-center { text-align: center; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Reporte General del Grupo: ${grupoSeleccionado.nombre}</h1>
              <p>Total de alumnos: ${alumnos.length} | Total de tareas registradas: ${(tareasData || []).length}</p>
            </div>

            <div class="seccion">
              <h2>Concentrado de Alumnos, Asistencias y Tareas</h2>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID / Alumno</th>
                    <th class="text-center">Asistencias</th>
                    <th class="text-center">Faltas</th>
                    <th class="text-center">Retardos</th>
                    <th class="text-center">Justificantes</th>
                    <th class="text-center">Tareas Cumplidas</th>
                    <th class="text-center">Tareas Faltantes</th>
                  </tr>
                </thead>
                <tbody>
                  ${alumnos.map((alumno, index) => {
                    const aluEntregas = entregasData.filter(e => e.alumno_id === alumno.id && (e.estatus === 'completado' || e.entregado))
                    const cumplidas = aluEntregas.length
                    const totalTareas = (tareasData || []).length
                    const faltantes = Math.max(0, totalTareas - cumplidas)

                    const aluAsis = asistenciasData.filter(a => a.alumno_id === alumno.id)
                    const asisCount = aluAsis.filter(a => a.estatus === 'asistencia' || a.presente).length
                    const faltasCount = aluAsis.filter(a => a.estatus === 'falta' || a.falta).length
                    const retardosCount = aluAsis.filter(a => a.estatus === 'retardo').length
                    const justificantesCount = aluAsis.filter(a => a.estatus === 'justificante').length

                    return `
                      <tr>
                        <td>${index + 1}</td>
                        <td>
                          <strong>${alumno.nombre_completo}</strong><br>
                          <span style="font-family:monospace;font-size:0.75rem;color:#2563eb;">${alumno.id_corto}</span>
                        </td>
                        <td class="text-center">${asisCount}</td>
                        <td class="text-center" style="color: #dc2626; font-weight: bold;">${faltasCount}</td>
                        <td class="text-center">${retardosCount}</td>
                        <td class="text-center" style="color: #8b5cf6; font-weight: bold;">${justificantesCount}</td>
                        <td class="text-center" style="color: #16a34a; font-weight: bold;">${cumplidas}</td>
                        <td class="text-center" style="color: #d97706; font-weight: bold;">${faltantes}</td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div style="text-align: center; margin-top: 2rem;">
              <button onclick="window.print()" style="padding: 0.8rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1rem;">Guardar Reporte Grupal como PDF / Imprimir</button>
            </div>
          </body>
        </html>
      `)
      ventanaPrint.document.close()
    } catch (err) {
      console.error(err)
      alert('Error al generar el reporte grupal PDF.')
    }
  }

  if (vistaSecundaria === 'tareas') {
    return <SeccionTareas grupoSeleccionado={grupoSeleccionado} onVolver={() => setVistaSecundaria(null)} />
  }

  if (vistaSecundaria === 'calendario') {
    return <CalendarioTrimestral grupoSeleccionado={grupoSeleccionado} onVolver={() => setVistaSecundaria(null)} />
  }

  const alumnosPendientes = alumnos.filter(a => !asistenciasDia[a.id])
  const alumnosCompletados = alumnos.filter(a => asistenciasDia[a.id])

  if (!grupoSeleccionado) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando grupo...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', background: '#f1f5f9', padding: '0.75rem', borderRadius: '8px' }}>
        <button onClick={onVolver} style={{ padding: '0.4rem 0.8rem', background: '#cbd5e1', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
           Menú Principal
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Cambiar grupo:</span>
          <select 
            value={grupoSeleccionado.id} 
            onChange={(e) => {
              const seleccionado = todosLosGrupos.find(g => g.id === e.target.value)
              if (seleccionado) onCambiarGrupo(seleccionado)
            }}
            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', background: 'white' }}
          >
            {todosLosGrupos.map(g => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <BotonInstalar />
          <button onClick={() => setVistaSecundaria('asistencias')} style={{ padding: '0.4rem 0.8rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
             Asistencias
          </button>
          <button onClick={() => setVistaSecundaria('tareas')} style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
             Tareas
          </button>
          <button onClick={() => setVistaSecundaria('calendario')} style={{ padding: '0.4rem 0.8rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
             Calendario
          </button>
        </div>
      </div>

      {/* VISTA DE ASISTENCIAS */}
      {vistaSecundaria === 'asistencias' ? (
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Control de Asistencia y Materiales - {grupoSeleccionado.nombre}</h2>
            <input 
              type="date" 
              value={fechaAsistencia} 
              onChange={(e) => setFechaAsistencia(e.target.value)} 
              style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', background: 'white' }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #e2e8f0' }}>
            <div>
              <strong>Pendientes de pasar lista:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{alumnosPendientes.length}</span> de {alumnos.length}
            </div>
            {alumnosCompletados.length > 0 && (
              <button 
                onClick={() => setVerCompletadosAsistencia(!verCompletadosAsistencia)}
                style={{ background: 'none', border: 'none', color: '#8b5cf6', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                {verCompletadosAsistencia ? 'Ocultar pasados' : `Ver ya pasados (${alumnosCompletados.length})`}
              </button>
            )}
          </div>

          {/* ALUMNOS PENDIENTES */}
          {alumnos.length === 0 ? (
            <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay alumnos registrados en este grupo.</p>
          ) : alumnosPendientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></div>
              <h3 style={{ margin: '0 0 0.3rem 0', color: '#166534', fontSize: '1.1rem' }}>¡Lista completada para este día!</h3>
              <p style={{ margin: 0, color: '#15803d', fontSize: '0.85rem' }}>Has registrado la asistencia y materiales de todos los alumnos.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '450px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.6rem' }}>Foto</th>
                    <th style={{ padding: '0.6rem' }}>Alumno</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>Estatus de Asistencia</th>
                    <th style={{ padding: '0.6rem', textAlign: 'center' }}>Materiales / Flauta</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosPendientes.map((alumno) => {
                    const estatus = asistenciasDia[alumno.id] || 'asistencia'
                    const materialesAlu = materialesDia[alumno.id] || { flauta: false, cuaderno: false }
                    const historialAlu = historialAsistencias[alumno.id] || []
                    return (
                      <tr key={alumno.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.6rem' }}>
                          {alumno.foto_url ? (
                            <img src={alumno.foto_url} alt="Foto" onClick={() => setAlumnoSeleccionadoModal(alumno)} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
                          ) : (
                            <div onClick={() => setAlumnoSeleccionadoModal(alumno)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#64748b', cursor: 'pointer' }}>Sin foto</div>
                          )}
                        </td>
                        <td style={{ padding: '0.6rem' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb', fontSize: '0.75rem' }}>{alumno.id_corto}</div>
                          <div style={{ fontWeight: 'bold' }}>{alumno.nombre_completo}</div>
                          {/* Historial rápido de asistencia */}
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Últimas:</span>
                            {historialAlu.slice(0, 5).map((reg, idx) => {
                              const colorBg = 
                                reg.estatus === 'asistencia' || reg.estatus === 'presente' ? '#d1fae5' :
                                reg.estatus === 'falta' ? '#fee2e2' :
                                reg.estatus === 'retardo' ? '#fef3c7' : '#ede9fe';
                              const colorText = 
                                reg.estatus === 'asistencia' || reg.estatus === 'presente' ? '#065f46' :
                                reg.estatus === 'falta' ? '#991b1b' :
                                reg.estatus === 'retardo' ? '#92400e' : '#5b21b6';
                              const letra = 
                                reg.estatus === 'asistencia' || reg.estatus === 'presente' ? 'A' :
                                reg.estatus === 'falta' ? 'F' :
                                reg.estatus === 'retardo' ? 'R' : 'J';
                              
                              const partesFecha = reg.fecha.split('-');
                              const fechaCorta = partesFecha.length === 3 ? `${partesFecha[2]}/${partesFecha[1]}` : reg.fecha;

                              return (
                                <span key={idx} title={`${reg.fecha}: ${reg.estatus}`} style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px', background: colorBg, color: colorText, fontWeight: 'bold' }}>
                                  {fechaCorta}: {letra}
                                </span>
                              )
                            })}
                            {historialAlu.length === 0 && (
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin registros</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%', maxWidth: '130px', margin: '0 auto' }}>
                            <button 
                              onClick={() => cambiarAsistencia(alumno.id, 'asistencia')}
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '4px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                width: '100%',
                                background: estatus === 'asistencia' || estatus === 'presente' ? '#10b981' : '#f1f5f9',
                                color: estatus === 'asistencia' || estatus === 'presente' ? 'white' : '#64748b'
                              }}
                            >
                              Asistencia
                            </button>
                            <button 
                              onClick={() => cambiarAsistencia(alumno.id, 'falta')}
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '4px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                width: '100%',
                                background: estatus === 'falta' ? '#ef4444' : '#f1f5f9',
                                color: estatus === 'falta' ? 'white' : '#64748b'
                              }}
                            >
                              Falta
                            </button>
                            <button 
                              onClick={() => cambiarAsistencia(alumno.id, 'retardo')}
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '4px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                width: '100%',
                                background: estatus === 'retardo' ? '#f59e0b' : '#f1f5f9',
                                color: estatus === 'retardo' ? 'white' : '#64748b'
                              }}
                            >
                              Retardo
                            </button>
                            <button 
                              onClick={() => cambiarAsistencia(alumno.id, 'justificante')}
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '4px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                width: '100%',
                                background: estatus === 'justificante' ? '#8b5cf6' : '#f1f5f9',
                                color: estatus === 'justificante' ? 'white' : '#64748b'
                              }}
                            >
                              Justificante
                            </button>
                          </div>
                        </td>
                        {/* NUEVO: Botones para Flauta y Materiales */}
                        <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%', maxWidth: '120px', margin: '0 auto' }}>
                            <button 
                              onClick={() => cambiarMaterial(alumno.id, 'flauta')}
                              style={{
                                padding: '0.4rem 0.5rem',
                                borderRadius: '4px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                width: '100%',
                                background: materialesAlu.flauta ? '#8b5cf6' : '#f1f5f9',
                                color: materialesAlu.flauta ? 'white' : '#64748b'
                              }}
                            >
                              {materialesAlu.flauta ? '🎵 Flauta: SÍ' : '🎵 Flauta: NO'}
                            </button>
                            <button 
                              onClick={() => cambiarMaterial(alumno.id, 'cuaderno')}
                              style={{
                                padding: '0.4rem 0.5rem',
                                borderRadius: '4px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                width: '100%',
                                background: materialesAlu.cuaderno ? '#0ea5e9' : '#f1f5f9',
                                color: materialesAlu.cuaderno ? 'white' : '#64748b'
                              }}
                            >
                              {materialesAlu.cuaderno ? '📖 Material: SÍ' : '📖 Material: NO'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ALUMNOS YA PASADOS */}
          {verCompletadosAsistencia && alumnosCompletados.length > 0 && (
            <div style={{ marginTop: '1.5rem', borderTop: '2px dashed #e2e8f0', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#475569', marginBottom: '0.5rem' }}>Alumnos ya pasados (Puedes corregir si te equivocaste):</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '450px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.6rem' }}>Foto</th>
                      <th style={{ padding: '0.6rem' }}>Alumno</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Cambiar Estatus</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Materiales / Flauta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosCompletados.map((alumno) => {
                      const estatus = asistenciasDia[alumno.id]
                      const materialesAlu = materialesDia[alumno.id] || { flauta: false, cuaderno: false }
                      const historialAlu = historialAsistencias[alumno.id] || []
                      return (
                        <tr key={alumno.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#fafaf9' }}>
                          <td style={{ padding: '0.6rem' }}>
                            {alumno.foto_url ? (
                              <img src={alumno.foto_url} alt="Foto" onClick={() => setAlumnoSeleccionadoModal(alumno)} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
                            ) : (
                              <div onClick={() => setAlumnoSeleccionadoModal(alumno)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#64748b', cursor: 'pointer' }}>Sin foto</div>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem' }}>
                            <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb', fontSize: '0.75rem' }}>{alumno.id_corto}</div>
                            <div style={{ fontWeight: 'bold' }}>{alumno.nombre_completo}</div>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Últimas:</span>
                              {historialAlu.slice(0, 5).map((reg, idx) => {
                                const colorBg = 
                                  reg.estatus === 'asistencia' || reg.estatus === 'presente' ? '#d1fae5' :
                                  reg.estatus === 'falta' ? '#fee2e2' :
                                  reg.estatus === 'retardo' ? '#fef3c7' : '#ede9fe';
                                const colorText = 
                                  reg.estatus === 'asistencia' || reg.estatus === 'presente' ? '#065f46' :
                                  reg.estatus === 'falta' ? '#991b1b' :
                                  reg.estatus === 'retardo' ? '#92400e' : '#5b21b6';
                                const letra = 
                                  reg.estatus === 'asistencia' || reg.estatus === 'presente' ? 'A' :
                                  reg.estatus === 'falta' ? 'F' :
                                  reg.estatus === 'retardo' ? 'R' : 'J';
                                
                                const partesFecha = reg.fecha.split('-');
                                const fechaCorta = partesFecha.length === 3 ? `${partesFecha[2]}/${partesFecha[1]}` : reg.fecha;

                                return (
                                  <span key={idx} title={`${reg.fecha}: ${reg.estatus}`} style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '3px', background: colorBg, color: colorText, fontWeight: 'bold' }}>
                                    {fechaCorta}: {letra}
                                  </span>
                                )
                              })}
                            </div>
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%', maxWidth: '130px', margin: '0 auto' }}>
                              <button 
                                onClick={() => cambiarAsistencia(alumno.id, 'asistencia')}
                                style={{
                                  padding: '0.3rem 0.5rem',
                                  borderRadius: '4px',
                                  border: 'none',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  width: '100%',
                                  background: estatus === 'asistencia' || estatus === 'presente' ? '#10b981' : '#f1f5f9',
                                  color: estatus === 'asistencia' || estatus === 'presente' ? 'white' : '#64748b'
                                }}
                              >
                                Asistencia
                              </button>
                              <button 
                                onClick={() => cambiarAsistencia(alumno.id, 'falta')}
                                style={{
                                  padding: '0.3rem 0.5rem',
                                  borderRadius: '4px',
                                  border: 'none',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  width: '100%',
                                  background: estatus === 'falta' ? '#ef4444' : '#f1f5f9',
                                  color: estatus === 'falta' ? 'white' : '#64748b'
                                }}
                              >
                                Falta
                              </button>
                              <button 
                                onClick={() => cambiarAsistencia(alumno.id, 'retardo')}
                                style={{
                                  padding: '0.3rem 0.5rem',
                                  borderRadius: '4px',
                                  border: 'none',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  width: '100%',
                                  background: estatus === 'retardo' ? '#f59e0b' : '#f1f5f9',
                                  color: estatus === 'retardo' ? 'white' : '#64748b'
                                }}
                              >
                                Retardo
                              </button>
                              <button 
                                onClick={() => cambiarAsistencia(alumno.id, 'justificante')}
                                style={{
                                  padding: '0.3rem 0.5rem',
                                  borderRadius: '4px',
                                  border: 'none',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  width: '100%',
                                  background: estatus === 'justificante' ? '#8b5cf6' : '#f1f5f9',
                                  color: estatus === 'justificante' ? 'white' : '#64748b'
                                }}
                              >
                                Justificante
                              </button>
                            </div>
                          </td>
                          {/* NUEVO: Botones para Flauta y Materiales en alumnos ya pasados */}
                          <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%', maxWidth: '120px', margin: '0 auto' }}>
                              <button 
                                onClick={() => cambiarMaterial(alumno.id, 'flauta')}
                                style={{
                                  padding: '0.4rem 0.5rem',
                                  borderRadius: '4px',
                                  border: 'none',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  width: '100%',
                                  background: materialesAlu.flauta ? '#8b5cf6' : '#f1f5f9',
                                  color: materialesAlu.flauta ? 'white' : '#64748b'
                                }}
                              >
                                {materialesAlu.flauta ? '🎵 Flauta: SÍ' : '🎵 Flauta: NO'}
                              </button>
                              <button 
                                onClick={() => cambiarMaterial(alumno.id, 'cuaderno')}
                                style={{
                                  padding: '0.4rem 0.5rem',
                                  borderRadius: '4px',
                                  border: 'none',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  width: '100%',
                                  background: materialesAlu.cuaderno ? '#0ea5e9' : '#f1f5f9',
                                  color: materialesAlu.cuaderno ? 'white' : '#64748b'
                                }}
                              >
                                {materialesAlu.cuaderno ? '📖 Material: SÍ' : '📖 Material: NO'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VISTA PRINCIPAL DE ALUMNOS */
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Alumnos de {grupoSeleccionado.nombre}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {alumnos.length > 0 && (
                <button onClick={descargarReporteGrupoPDF} style={{ padding: '0.4rem 0.8rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                   Reporte PDF Grupo
                </button>
              )}
              <button onClick={() => setModoImportacion(!modoImportacion)} style={{ padding: '0.4rem 0.8rem', background: modoImportacion ? '#64748b' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {modoImportacion ? 'Registro Manual' : ' Importar Masivo'}
              </button>
            </div>
          </div>
          
          {modoImportacion ? (
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <textarea rows="4" placeholder="Pega aquí la lista..." value={textoMasivo} onChange={(e) => setTextoMasivo(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontFamily: 'monospace', boxSizing: 'border-box', fontSize: '0.9rem' }} />
              <button onClick={importarListaMasiva} style={{ marginTop: '0.5rem', padding: '0.6rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '0.9rem' }}>
                Procesar e Importar Alumnos
              </button>
            </div>
          ) : (
            <form onSubmit={agregarAlumno} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.5rem 0 1rem 0', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Datos del Alumno:</div>
              <input type="text" placeholder="Apellido Paterno" value={paterno} onChange={(e) => setPaterno(e.target.value.toUpperCase())} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Apellido Materno" value={materno} onChange={(e) => setMaterno(e.target.value.toUpperCase())} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Nombre(s)" value={nombres} onChange={(e) => setNombres(e.target.value.toUpperCase())} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              <input type="tel" placeholder="Teléfono del Alumno (Opcional)" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />

              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginTop: '0.3rem' }}>Datos del Tutor:</div>
              <input type="text" placeholder="Nombre del Tutor" value={nombreTutor} onChange={(e) => setNombreTutor(e.target.value.toUpperCase())} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              <input type="tel" placeholder="WhatsApp del Tutor (Ej. 7831234567)" value={whatsappTutor} onChange={(e) => setWhatsappTutor(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />

              <button type="submit" style={{ padding: '0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.4rem' }}>
                Registrar Alumno
              </button>
            </form>
          )}

          {alumnos.length === 0 ? (
            <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay alumnos registrados en este grupo.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', minWidth: '350px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.5rem' }}>Foto</th>
                    <th style={{ padding: '0.5rem' }}>Alumno</th>
                    <th style={{ padding: '0.5rem' }}>Tutor / Contacto</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((alumno) => (
                    <tr key={alumno.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.5rem' }}>
                        {alumno.foto_url ? (
                          <img src={alumno.foto_url} alt="Foto" onClick={() => setAlumnoSeleccionadoModal(alumno)} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
                        ) : (
                          <div onClick={() => setAlumnoSeleccionadoModal(alumno)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#64748b', cursor: 'pointer' }}>Sin foto</div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb', fontSize: '0.75rem' }}>{alumno.id_corto}</div>
                        <div style={{ fontWeight: 'bold' }}>{alumno.nombre_completo}</div>
                        {alumno.telefono && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tel: {alumno.telefono}</div>}
                      </td>
                      <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                        {alumno.nombre_tutor ? (
                          <>
                            <div style={{ fontWeight: '500' }}>{alumno.nombre_tutor}</div>
                            {alumno.whatsapp_tutor && (
                              <a href={`https://wa.me/52${alumno.whatsapp_tutor.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.2rem', color: '#16a34a', fontWeight: 'bold', textDecoration: 'none' }}>
                                 {alumno.whatsapp_tutor}
                              </a>
                            )}
                          </>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <label style={{ display: 'inline-block', padding: '0.4rem', background: subiendoFotoId === alumno.id ? '#94a3b8' : '#0ea5e9', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {subiendoFotoId === alumno.id ? '...' : ''}
                          <input type="file" accept="image/*" capture="environment" onChange={(e) => manejarCapturaFoto(e, alumno.id)} style={{ display: 'none' }} />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {alumnoSeleccionadoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem', boxSizing: 'border-box' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem' }}>{alumnoSeleccionadoModal.nombre_completo}</h3>
            <p style={{ margin: '0 0 0.8rem 0', fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb', fontSize: '0.85rem' }}>ID: {alumnoSeleccionadoModal.id_corto}</p>

            <div style={{ margin: '0 auto 1rem auto', width: '180px', height: '180px', borderRadius: '10px', overflow: 'hidden', border: '3px solid #e2e8f0' }}>
              {alumnoSeleccionadoModal.foto_url ? (
                <img src={alumnoSeleccionadoModal.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.8rem', background: '#f8fafc' }}>Sin foto</div>
              )}
            </div>

            <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '6px', textAlign: 'left', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid #e2e8f0' }}>
              <div><strong>Tel. Alumno:</strong> {alumnoSeleccionadoModal.telefono || 'N/A'}</div>
              <div style={{ marginTop: '0.3rem' }}><strong>Tutor:</strong> {alumnoSeleccionadoModal.nombre_tutor || 'N/A'}</div>
              {alumnoSeleccionadoModal.whatsapp_tutor && (
                <div style={{ marginTop: '0.3rem' }}>
                  <strong>WhatsApp:</strong> <a href={`https://wa.me/52${alumnoSeleccionadoModal.whatsapp_tutor.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontWeight: 'bold', textDecoration: 'none' }}> Abrir Chat</a>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={() => descargarReportePDF(alumnoSeleccionadoModal)} style={{ padding: '0.6rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                 Descargar Reporte PDF
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label style={{ flex: 1, padding: '0.6rem', background: '#0ea5e9', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                   Cambiar
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => manejarCapturaFoto(e, alumnoSeleccionadoModal.id)} style={{ display: 'none' }} />
                </label>
                <button onClick={() => setAlumnoSeleccionadoModal(null)} style={{ flex: 1, padding: '0.6rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}