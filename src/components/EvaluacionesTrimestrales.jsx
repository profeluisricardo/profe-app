import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Ajusta la ruta a tu cliente de Supabase

export default function EvaluacionesTrimestrales() {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [evaluacionData, setEvaluacionData] = useState(null);
  const [cargando, setCargando] = useState(false);

  // 1. Cargar la lista de alumnos al iniciar
  useEffect(() => {
    async function fetchAlumnos() {
      const { data, error } = await supabase
        .from('alumnos')
        .select('id, nombre_completo, grupo_id')
        .order('nombre_completo', { ascending: true });
      
      if (!error && data) setAlumnos(data);
    }
    fetchAlumnos();
  }, []);

  // 2. Consultar la evaluación consolidada y la vista de promedios al seleccionar un alumno
  const seleccionarAlumno = async (alumno) => {
    setAlumnoSeleccionado(alumno);
    setCargando(true);

    try {
      // Consultamos las evaluaciones consolidadas del alumno
      const { data, error } = await supabase
        .from('evaluaciones_consolidadas')
        .select(`
          *,
          periodos_evaluacion (numero_periodo, ciclo_escolar)
        `)
        .eq('alumno_id', alumno.id);

      if (error) throw error;
      setEvaluacionData(data);
    } catch (err) {
      console.error("Error al cargar calificaciones:", err.message);
    } finally {
      setCargando(false);
    }
  };

  // 3. Función para disparar la exportación a PDF usando la impresión estilizada del navegador
  const descargarPDF = () => {
    window.print();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#1b365d', borderBottom: '2px solid #1b365d', paddingBottom: '8px' }}>
        Panel de Evaluaciones y Reportes Trimestrales
      </h2>

      {/* Selector de Alumnos */}
      <div style={{ margin: '20px 0', background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Seleccionar Alumno:</label>
        <select 
          onChange={(e) => {
            const alumno = alumnos.find(a => a.id == e.target.value);
            if (alumno) seleccionarAlumno(alumno);
          }}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1em' }}
        >
          <option value="">-- Elige un alumno --</option>
          {alumnos.map(a => (
            <option key={a.id} value={a.id}>{a.nombre_completo}</option>
          ))}
        </select>
      </div>

      {/* Vista previa imprimible para el PDF */}
      {alumnoSeleccionado && (
        <div id="reporte-pdf" style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '20px' }}>
          
          <div style={{ background: '#1b365d', color: 'white', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5em' }}>REPORTE DE EVALUACIÓN TRIMESTRAL</h1>
            <p style={{ margin: '5px 0 0 0', color: '#cbd5e1' }}>Sistema Integral de Control Escolar - Artística y Música</p>
          </div>

          <div style={{ marginBottom: '20px', padding: '12px', background: '#f1f5f9', borderRadius: '4px' }}>
            <p style={{ margin: '4px 0' }}><strong>Alumno(a):</strong> {alumnoSeleccionado.nombre_completo}</p>
            <p style={{ margin: '4px 0' }}><strong>Ciclo Escolar:</strong> 2025-2026</p>
          </div>

          <h3>Desglose de Ponderación Oficial</h3>
          <p style={{ fontSize: '0.95em', fontStyle: 'italic', color: '#475569' }}>
            Fórmula aplicada en Base de Datos: (Asistencia × 0.10) + (Materiales × 0.10) + (Trabajos × 0.60) + (Examen × 0.20)
          </p>

          {cargando ? (
            <p>Cargando calificaciones...</p>
          ) : evaluacionData && evaluacionData.length > 0 ? (
            evaluacionData.map((ev, index) => (
              <div key={index} style={{ marginBottom: '30px', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '6px' }}>
                <h4 style={{ color: '#1b365d', marginTop: 0 }}>Trimestre {ev.periodos_evaluacion?.numero_periodo}</h4>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.95em' }}>
                  <thead>
                    <tr style={{ background: '#1b365d', color: 'white' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Componente</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Ponderación</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Asistencia y Puntualidad</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>10%</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{ev.promedio_asistencia}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Materiales (Flauta, Libretas)</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>10%</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{ev.promedio_materiales}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Trabajos y Actividades</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>60%</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{ev.promedio_trabajos}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Examen Parcial</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>20%</td>
                      <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>{ev.promedio_examen}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: '15px', background: '#e2e8f0', padding: '10px', borderRadius: '4px', textAlign: 'right', fontWeight: 'bold', color: '#1b365d' }}>
                  CALIFICACIÓN FINAL DEL PERIODO: {ev.calificacion_final}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay evaluaciones registradas para este alumno todavía.</p>
          )}

          {/* Botón de Descarga / Impresión PDF */}
          <div style={{ textAlign: 'right', marginTop: '20px' }} className="no-print">
            <button 
              onClick={descargarPDF}
              style={{ background: '#d4af37', color: '#1b365d', border: 'none', padding: '10px 20px', fontSize: '1em', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
            >
              🖨️ Descargar / Imprimir Reporte PDF
            </button>
          </div>

        </div>
      )}
    </div>
  );
}