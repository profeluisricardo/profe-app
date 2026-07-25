import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function EvaluacionesTrimestrales() {
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  
  const [vistaGeneral, setVistaGeneral] = useState(true);
  const [resumenGlobal, setResumenGlobal] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarGruposYGral();
  }, []);

  useEffect(() => {
    if (grupoSeleccionado) {
      cargarAlumnosPorGrupo(grupoSeleccionado);
      setVistaGeneral(false);
    } else {
      setAlumnos([]);
    }
  }, [grupoSeleccionado]);

  useEffect(() => {
    if (alumnoSeleccionado) {
      cargarDatosAlumno(alumnoSeleccionado.id);
    }
  }, [alumnoSeleccionado]);

  const cargarGruposYGral = async () => {
    setCargando(true);
    const { data: gruposData } = await supabase.from('grupos').select('*').order('nombre');
    if (gruposData) setGrupos(gruposData);

    const { data: alumnosData } = await supabase.from('alumnos').select('*, grupos(nombre)');
    const { data: evalsData } = await supabase.from('evaluaciones_consolidadas').select('*');

    if (alumnosData) {
      const globalProcesado = alumnosData.map(alum => {
        const evalsAlum = evalsData ? evalsData.filter(e => e.alumno_id === alum.id) : [];
        const sumaPromedios = evalsAlum.reduce((acc, curr) => acc + (Number(curr.promedio_final) || 0), 0);
        const promedioGeneral = evalsAlum.length > 0 ? sumaPromedios / evalsAlum.length : 0;

        return {
          ...alum,
          grupoNombre: alum.grupos?.nombre || 'Sin Grupo',
          promedioGeneral,
          asistencias: 28,
          faltas: 2,
          retardos: 1,
          entregadas: 14,
          porEntregar: 2
        };
      });
      setResumenGlobal(globalProcesado);
    }
    setCargando(false);
  };

  const cargarAlumnosPorGrupo = async (grupoId) => {
    setCargando(true);
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('grupo_id', grupoId)
      .order('apellido');

    if (!error && data) {
      setAlumnos(data);
    } else {
      setAlumnos([]);
    }
    setCargando(false);
  };

  const cargarDatosAlumno = async (alumnoId) => {
    const { data: evalData } = await supabase
      .from('evaluaciones_consolidadas')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('trimestre');

    if (evalData) setCalificaciones(evalData);
  };

  const obtenerSemaforo = (promedio) => {
    const val = Number(promedio);
    if (!val || val === 0) return { color: 'bg-slate-100 text-slate-700 border-slate-300', icon: '⚪', texto: 'Sin evaluar' };
    if (val >= 8.5) return { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '🟢', texto: 'Excelente' };
    if (val >= 6.0) return { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: '🟡', texto: 'Regular' };
    return { color: 'bg-rose-100 text-rose-800 border-rose-300', icon: '🔴', texto: 'En Riesgo' };
  };

  const imprimirPDF = () => {
    window.print();
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-md space-y-4">
      {/* Encabezado Impresión PDF */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Escuela Secundaria - Reporte Escolar</h1>
        <p className="text-sm text-slate-600">Sistema Integral de Asistencias, Tareas y Evaluaciones</p>
        <hr className="my-2 border-slate-300" />
      </div>

      {/* CONTROLES MÓVIL / ESCRITORIO OPTIMIZADOS */}
      <div className="print:hidden flex flex-col gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <button
            onClick={() => {
              setVistaGeneral(true);
              setAlumnoSeleccionado(null);
              setGrupoSeleccionado('');
            }}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm shadow transition flex items-center justify-center gap-2 ${
              vistaGeneral ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
            }`}
          >
            🌐 Semáforo General
          </button>

          <button
            onClick={imprimirPDF}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg shadow text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            🖨️ Imprimir Reporte PDF
          </button>
        </div>

        {/* Selectores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Filtrar Grupo:</label>
            <select 
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
              value={grupoSeleccionado}
              onChange={(e) => {
                setGrupoSeleccionado(e.target.value);
                setAlumnoSeleccionado(null);
              }}
            >
              <option value="">-- Seleccione grupo --</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Seleccionar Alumno:</label>
            <select 
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              value={alumnoSeleccionado ? alumnoSeleccionado.id : ''}
              onChange={(e) => {
                const alum = alumnos.find(a => a.id === e.target.value);
                if (alum) {
                  setAlumnoSeleccionado(alum);
                  setVistaGeneral(false);
                }
              }}
              disabled={!grupoSeleccionado || cargando}
            >
              <option value="">{cargando ? 'Cargando...' : '-- Seleccione alumno --'}</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>{a.apellido} {a.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VISTA 1: SEMÁFORO GENERAL CON ANCHO DE TABLA BLINDADO */}
      {vistaGeneral && !alumnoSeleccionado && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">📊 Semáforo y Estatus General</h2>
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-semibold">
              Total: {resumenGlobal.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[700px]">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="p-3 w-1/3">Alumno</th>
                  <th className="p-3 w-24">Grupo</th>
                  <th className="p-3 text-center w-28 whitespace-nowrap">Asis / Faltas</th>
                  <th className="p-3 text-center w-32 whitespace-nowrap">Tareas (OK / Pend)</th>
                  <th className="p-3 text-center w-24 whitespace-nowrap">Promedio</th>
                  <th className="p-3 text-center w-32 bg-slate-900">Semáforo</th>
                  <th className="p-3 text-center w-20 print:hidden">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 dark:bg-slate-800">
                {resumenGlobal.length > 0 ? (
                  resumenGlobal.map((item) => {
                    const sem = obtenerSemaforo(item.promedioGeneral);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                          {/* MINIATURA ESTRICTA 8x8 FIJA */}
                          {item.foto_url ? (
                            <img src={item.foto_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-600" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {item.nombre?.[0]}{item.apellido?.[0]}
                            </div>
                          )}
                          <span className="truncate">{item.apellido} {item.nombre}</span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">{item.grupoNombre}</td>
                        <td className="p-3 text-center text-xs whitespace-nowrap">
                          <span className="text-emerald-600 font-bold">{item.asistencias}</span> / <span className="text-rose-600 font-bold">{item.faltas}</span>
                        </td>
                        <td className="p-3 text-center text-xs whitespace-nowrap">
                          <span className="text-blue-600 font-bold">{item.entregadas}</span> / <span className="text-amber-600 font-bold">{item.porEntregar}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-200">
                          {item.promedioGeneral > 0 ? item.promedioGeneral.toFixed(1) : 'N/D'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold ${sem.color}`}>
                            {sem.icon} {sem.texto}
                          </span>
                        </td>
                        <td className="p-3 text-center print:hidden">
                          <button
                            onClick={() => {
                              setAlumnoSeleccionado(item);
                              setVistaGeneral(false);
                            }}
                            className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-bold transition"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-500 italic">
                      Cargando alumnos...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: DETALLE INDIVIDUAL */}
      {alumnoSeleccionado && (
        <div className="space-y-4">
          <div className="print:hidden">
            <button
              onClick={() => setAlumnoSeleccionado(null)}
              className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition"
            >
              ← Volver al Semáforo General
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            {alumnoSeleccionado.foto_url ? (
              <img src={alumnoSeleccionado.foto_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md border-2 border-white shrink-0">
                {alumnoSeleccionado.nombre?.[0]}{alumnoSeleccionado.apellido?.[0]}
              </div>
            )}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{alumnoSeleccionado.apellido} {alumnoSeleccionado.nombre}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Grupo: {alumnoSeleccionado.grupoNombre || 'Asignado'}</p>
              <span className="inline-block mt-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                Fórmula: (Asis 10%) + (Mat 10%) + (Trab 60%) + (Exam 20%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">📋 Asistencias</h3>
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Asist.</span>
                  <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">28</span>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                  <span className="block text-[10px] text-rose-700 dark:text-rose-400 font-semibold">Faltas</span>
                  <span className="text-sm font-bold text-rose-900 dark:text-rose-200">2</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                  <span className="block text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Retardos</span>
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200">1</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="block text-[10px] text-blue-700 dark:text-blue-400 font-semibold">Justif.</span>
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-200">1</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">📚 Tareas</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-blue-700 dark:text-blue-400 font-semibold">Entregadas</span>
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-200">14</span>
                  </div>
                  <span>✅</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Pendientes</span>
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-200">2</span>
                  </div>
                  <span>⚠️</span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="p-2.5">Trimestre</th>
                  <th className="p-2.5 text-center">Asist (10%)</th>
                  <th className="p-2.5 text-center">Mat (10%)</th>
                  <th className="p-2.5 text-center">Trab (60%)</th>
                  <th className="p-2.5 text-center">Exam (20%)</th>
                  <th className="p-2.5 text-center bg-slate-900">Prom / Semáforo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 dark:bg-slate-800">
                {calificaciones.length > 0 ? (
                  calificaciones.map((cal, idx) => {
                    const sem = obtenerSemaforo(cal.promedio_final);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-200">Trimestre {cal.trimestre}</td>
                        <td className="p-2.5 text-center dark:text-slate-300">{cal.asistencia ?? '-'}</td>
                        <td className="p-2.5 text-center dark:text-slate-300">{cal.materiales ?? '-'}</td>
                        <td className="p-2.5 text-center dark:text-slate-300">{cal.trabajos ?? '-'}</td>
                        <td className="p-2.5 text-center dark:text-slate-300">{cal.examen ?? '-'}</td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${sem.color}`}>
                            {sem.icon} {cal.promedio_final ? Number(cal.promedio_final).toFixed(1) : 'N/D'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-500 italic">
                      Sin calificaciones capturadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Firmas para PDF */}
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
      )}
    </div>
  );
}