import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function EvaluacionesTrimestrales() {
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Cargar grupos al montar el componente
  useEffect(() => {
    cargarGrupos();
  }, []);

  // Cargar alumnos al cambiar de grupo
  useEffect(() => {
    if (grupoSeleccionado) {
      cargarAlumnos(grupoSeleccionado);
    } else {
      setAlumnos([]);
      setAlumnoSeleccionado(null);
    }
  }, [grupoSeleccionado]);

  // Cargar calificaciones del alumno seleccionado
  useEffect(() => {
    if (alumnoSeleccionado) {
      cargarCalificacionesAlumno(alumnoSeleccionado.id);
    } else {
      setCalificaciones([]);
    }
  }, [alumnoSeleccionado]);

  const cargarGrupos = async () => {
    const { data, error } = await supabase.from('grupos').select('*').order('nombre');
    if (!error && data) {
      setGrupos(data);
    }
  };

  const cargarAlumnos = async (grupoId) => {
    setCargando(true);
    // Asumiendo que tu tabla de alumnos tiene campos como id, nombre, apellido, foto_url
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('grupo_id', grupoId)
      .order('apellido');
    
    if (!error && data) {
      setAlumnos(data);
    }
    setCargando(false);
  };

  const cargarCalificacionesAlumno = async (alumnoId) => {
    // Consultando la vista o tabla de evaluaciones consolidadas
    const { data, error } = await supabase
      .from('evaluaciones_consolidadas')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('trimestre');

    if (!error && data) {
      setCalificaciones(data);
    }
  };

  const imprimirBoleta = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      {/* Encabezado Oculto en Pantalla, Visible en PDF */}
      <div className="print-only hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Escuela Secundaria</h1>
        <p className="text-sm text-slate-600">Reporte Individual de Evaluaciones y Asistencias</p>
        <hr className="my-2 border-slate-300" />
      </div>

      {/* Controles de Selección (No salen en el PDF) */}
      <div className="print:hidden flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Seleccionar Grupo:</label>
          <select 
            className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
            value={grupoSeleccionado}
            onChange={(e) => {
              setGrupoSeleccionado(e.target.value);
              setAlumnoSeleccionado(null);
            }}
          >
            <option value="">-- Seleccione un grupo --</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-1/2">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Seleccionar Alumno:</label>
          <select 
            className="w-full p-2.5 border border-slate-300 rounded-md bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
            value={alumnoSeleccionado ? alumnoSeleccionado.id : ''}
            onChange={(e) => {
              const alumno = alumnos.find(a => a.id === e.target.value);
              setAlumnoSeleccionado(alumno || null);
            }}
            disabled={!grupoSeleccionado || cargando}
          >
            <option value="">-- Seleccione un alumno --</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>{a.apellido} {a.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vista de Detalle del Alumno y sus Calificaciones */}
      {alumnoSeleccionado ? (
        <div className="space-y-6">
          {/* Tarjeta de Información del Alumno */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative">
              {alumnoSeleccionado.foto_url ? (
                <img 
                  src={alumnoSeleccionado.foto_url} 
                  alt={`Foto de ${alumnoSeleccionado.nombre}`} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md border-4 border-white">
                  {alumnoSeleccionado.nombre?.[0]}{alumnoSeleccionado.apellido?.[0]}
                </div>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold text-slate-800">
                {alumnoSeleccionado.apellido} {alumnoSeleccionado.nombre}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">Matrícula / ID: {alumnoSeleccionado.id.slice(0, 8)}</p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Fórmula: (Asistencia 10%) + (Materiales 10%) + (Trabajos 60%) + (Examen 20%)
                </span>
              </div>
            </div>

            <div className="print:hidden">
              <button 
                onClick={imprimirBoleta}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg shadow transition flex items-center gap-2 cursor-pointer"
              >
                🖨️ Descargar / Imprimir PDF
              </button>
            </div>
          </div>

          {/* Tabla de Calificaciones Trimestrales */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-sm">
                  <th className="p-3">Trimestre</th>
                  <th className="p-3 text-center">Asistencia (10%)</th>
                  <th className="p-3 text-center">Materiales (10%)</th>
                  <th className="p-3 text-center">Trabajos (60%)</th>
                  <th className="p-3 text-center">Examen (20%)</th>
                  <th className="p-3 text-center bg-slate-900">Promedio Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {calificaciones.length > 0 ? (
                  calificaciones.map((cal, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-700">Trimestre {cal.trimestre}</td>
                      <td className="p-3 text-center text-slate-600">{cal.asistencia ?? '-'}</td>
                      <td className="p-3 text-center text-slate-600">{cal.materiales ?? '-'}</td>
                      <td className="p-3 text-center text-slate-600">{cal.trabajos ?? '-'}</td>
                      <td className="p-3 text-center text-slate-600">{cal.examen ?? '-'}</td>
                      <td className="p-3 text-center font-bold text-blue-700 bg-blue-50/50">
                        {cal.promedio_final ? Number(cal.promedio_final).toFixed(1) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-500 italic">
                      No hay registros de calificaciones capturadas para este alumno.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sección de Firmas para el PDF */}
          <div className="hidden print:flex justify-between mt-20 pt-10 px-12 border-t border-slate-300 text-center text-sm text-slate-700">
            <div>
              <div className="w-48 border-b border-slate-400 mb-2"></div>
              <p className="font-semibold">Firma del Docente</p>
            </div>
            <div>
              <div className="w-48 border-b border-slate-400 mb-2"></div>
              <p className="font-semibold">Firma del Padre o Tutor</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-lg">Selecciona un grupo y un alumno para visualizar su boleta de calificaciones.</p>
        </div>
      )}
    </div>
  );
}