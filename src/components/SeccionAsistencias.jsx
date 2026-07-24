export default function SeccionAsistencias({
  grupoSeleccionado,
  fechaAsistencia,
  setFechaAsistencia,
  alumnos,
  alumnosPendientes,
  alumnosCompletados,
  asistenciasDia,
  historialAsistencias,
  verCompletadosAsistencia,
  setVerCompletadosAsistencia,
  cambiarAsistencia,
  cambiarMaterial,
  setAlumnoSeleccionadoModal
}) {
  return (
    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Control de Asistencia y Materiales</h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Grupo: {grupoSeleccionado.nombre}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Fecha:</label>
          <input 
            type="date" 
            value={fechaAsistencia} 
            onChange={(e) => setFechaAsistencia(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', background: 'white' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <button 
          onClick={() => setVerCompletadosAsistencia(false)}
          style={{ 
            padding: '0.4rem 0.8rem', 
            background: !verCompletadosAsistencia ? '#2563eb' : '#f1f5f9', 
            color: !verCompletadosAsistencia ? 'white' : '#64748b', 
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' 
          }}
        >
          Pendientes de pase ({alumnosPendientes.length})
        </button>
        <button 
          onClick={() => setVerCompletadosAsistencia(true)}
          style={{ 
            padding: '0.4rem 0.8rem', 
            background: verCompletadosAsistencia ? '#2563eb' : '#f1f5f9', 
            color: verCompletadosAsistencia ? 'white' : '#64748b', 
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' 
          }}
        >
          Registrados hoy ({alumnosCompletados.length})
        </button>
      </div>

      {alumnos.length === 0 ? (
        <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>No hay alumnos en este grupo para pasar lista.</p>
      ) : (
        <div>
          {(!verCompletadosAsistencia ? alumnosPendientes : alumnosCompletados).length === 0 ? (
            <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem' }}>
              {!verCompletadosAsistencia ? '🎉 ¡Excelente! Ya pasaste lista a todos los alumnos de este día.' : 'No hay alumnos registrados con estatus en esta vista.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '450px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.5rem' }}>Foto</th>
                    <th style={{ padding: '0.5rem' }}>Alumno</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Estatus y Materiales</th>
                  </tr>
                </thead>
                <tbody>
                  {(!verCompletadosAsistencia ? alumnosPendientes : alumnosCompletados).map((alumno) => {
                    const registroAlumno = asistenciasDia[alumno.id] || {}
                    const estatusActual = registroAlumno.estatus || registroAlumno.asistencia
                    
                    return (
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
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          {/* Botones de Asistencia */}
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                            <button 
                              onClick={() => cambiarAsistencia(alumno.id, 'asistencia')}
                              style={{ 
                                padding: '0.3rem 0.6rem', 
                                background: estatusActual === 'asistencia' ? '#16a34a' : '#f1f5f9', 
                                color: estatusActual === 'asistencia' ? 'white' : '#334155', 
                                border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' 
                              }}
                            >
                              Asistencia
                            </button>
                            <button 
                              onClick={() => cambiarAsistencia(alumno.id, 'falta')}
                              style={{ 
                                padding: '0.3rem 0.6rem', 
                                background: estatusActual === 'falta' ? '#dc2626' : '#f1f5f9', 
                                color: estatusActual === 'falta' ? 'white' : '#334155', 
                                border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' 
                              }}
                            >
                              Falta
                            </button>
                            <button 
                              onClick={() => cambiarAsistencia(alumno.id, 'retardo')}
                              style={{ 
                                padding: '0.3rem 0.6rem', 
                                background: estatusActual === 'retardo' ? '#d97706' : '#f1f5f9', 
                                color: estatusActual === 'retardo' ? 'white' : '#334155', 
                                border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' 
                              }}
                            >
                              Retardo
                            </button>
                            <button 
                              onClick={() => cambiarAsistencia(alumno.id, 'justificante')}
                              style={{ 
                                padding: '0.3rem 0.6rem', 
                                background: estatusActual === 'justificante' ? '#8b5cf6' : '#f1f5f9', 
                                color: estatusActual === 'justificante' ? 'white' : '#334155', 
                                border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' 
                              }}
                            >
                              Justificante
                            </button>
                          </div>

                          {/* Botones de Materiales */}
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', flexWrap: 'wrap', borderTop: '1px dashed #e2e8f0', paddingTop: '0.3rem' }}>
                            <button 
                              onClick={() => cambiarMaterial && cambiarMaterial(alumno.id, 'flauta')}
                              style={{ 
                                padding: '0.2rem 0.5rem', 
                                background: registroAlumno.flauta ? '#0284c7' : '#f8fafc', 
                                color: registroAlumno.flauta ? 'white' : '#64748b', 
                                border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' 
                              }}
                              title="Flauta"
                            >
                              🎵 Flauta
                            </button>
                            <button 
                              onClick={() => cambiarMaterial && cambiarMaterial(alumno.id, 'cuaderno_pautado')}
                              style={{ 
                                padding: '0.2rem 0.5rem', 
                                background: registroAlumno.cuaderno_pautado ? '#0284c7' : '#f8fafc', 
                                color: registroAlumno.cuaderno_pautado ? 'white' : '#64748b', 
                                border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' 
                              }}
                              title="Cuaderno Pautado"
                            >
                              🎼 C. Pautado
                            </button>
                            <button 
                              onClick={() => cambiarMaterial && cambiarMaterial(alumno.id, 'libreta_artes')}
                              style={{ 
                                padding: '0.2rem 0.5rem', 
                                background: registroAlumno.libreta_artes ? '#0284c7' : '#f8fafc', 
                                color: registroAlumno.libreta_artes ? 'white' : '#64748b', 
                                border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' 
                              }}
                              title="Libreta de Artes"
                            >
                              🎨 L. Artes
                            </button>
                            <button 
                              onClick={() => cambiarMaterial && cambiarMaterial(alumno.id, 'libro_lenguajes')}
                              style={{ 
                                padding: '0.2rem 0.5rem', 
                                background: registroAlumno.libro_lenguajes ? '#0284c7' : '#f8fafc', 
                                color: registroAlumno.libro_lenguajes ? 'white' : '#64748b', 
                                border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' 
                              }}
                              title="Libro de Lenguajes"
                            >
                              📖 Libro
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
        </div>
      )}
    </div>
  )
}