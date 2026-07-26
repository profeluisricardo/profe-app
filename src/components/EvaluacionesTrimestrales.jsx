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

  // Estados para el Modal de Crear / Editar Alumno
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idAlumnoEditando, setIdAlumnoEditando] = useState(null);
  
  // Parámetros limpios para el alumno (usando apellido_paterno y apellido_materno)
  const [formNombre, setFormNombre] = useState('');
  const [formApellidoPaterno, setFormApellidoPaterno] = useState('');
  const [formApellidoMaterno, setFormApellidoMaterno] = useState('');
  const [formIdCorto, setFormIdCorto] = useState('');
  const [formGrupoId, setFormGrupoId] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState('');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (grupoSeleccionado) {
      cargarAlumnosPorGrupo(grupoSeleccionado);
    } else {
      setAlumnos([]);
    }
  }, [grupoSeleccionado]);

  useEffect(() => {
    if (alumnoSeleccionado) {
      cargarDatosAlumno(alumnoSeleccionado.id);
    }
  }, [alumnoSeleccionado]);

  const procesarAlumnosData = (data, evalsData) => {
    return data.map(alum => {
      const evalsAlum = evalsData ? evalsData.filter(e => e.alumno_id === alum.id) : [];
      const sumaPromedios = evalsAlum.reduce((acc, curr) => acc + (Number(curr.calificacion_final) || 0), 0);
      const promedioGeneral = evalsAlum.length > 0 ? sumaPromedios / evalsAlum.length : 0;

      const nombreCompleto = `${alum.nombre || ''} ${alum.apellido_paterno || ''} ${alum.apellido_materno || ''}`.trim() || 'Sin Nombre';

      return {
        ...alum,
        nombre: alum.nombre || '',
        apellido_paterno: alum.apellido_paterno || '',
        apellido_materno: alum.apellido_materno || '',
        id_corto: alum.id_corto || 'S/N',
        nombreCompleto,
        grupoNombre: alum.grupos?.nombre || 'Sin Grupo',
        promedioGeneral,
        asistencias: 28,
        faltas: 2
      };
    });
  };

  const cargarDatosIniciales = async () => {
    setCargando(true);
    const { data: gruposData } = await supabase.from('grupos').select('*').order('nombre');
    if (gruposData) setGrupos(gruposData);

    const { data: alumnosData } = await supabase.from('alumnos').select('*, grupos(nombre)').order('apellido_paterno', { ascending: true });
    const { data: evalsData } = await supabase.from('evaluaciones_consolidadas').select('*');

    if (alumnosData) {
      const globalProcesado = procesarAlumnosData(alumnosData, evalsData);
      setResumenGlobal(globalProcesado);
    }
    setCargando(false);
  };

  const cargarAlumnosPorGrupo = async (grupoId) => {
    setCargando(true);
    const { data, error } = await supabase
      .from('alumnos')
      .select('*, grupos(nombre)')
      .eq('grupo_id', grupoId)
      .order('apellido_paterno', { ascending: true });

    if (!error && data) {
      const { data: evalsData } = await supabase.from('evaluaciones_consolidadas').select('*');
      const procesados = procesarAlumnosData(data, evalsData);
      setAlumnos(procesados);
    } else {
      setAlumnos([]);
    }
    setCargando(false);
  };

  const cargarDatosAlumno = async (alumnoId) => {
    const { data: evalData } = await supabase
      .from('evaluaciones_consolidadas')
      .select('*, periodos_evaluacion(numero_periodo)')
      .eq('alumno_id', alumnoId);

    if (evalData) setCalificaciones(evalData);
  };

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setIdAlumnoEditando(null);
    setFormNombre('');
    setFormApellidoPaterno('');
    setFormApellidoMaterno('');
    setFormIdCorto('');
    setFormGrupoId(grupoSeleccionado || (grupos[0]?.id ?? ''));
    setFormFotoUrl('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (item) => {
    setModoEdicion(true);
    setIdAlumnoEditando(item.id);
    setFormNombre(item.nombre);
    setFormApellidoPaterno(item.apellido_paterno);
    setFormApellidoMaterno(item.apellido_materno);
    setFormIdCorto(item.id_corto);
    setFormGrupoId(item.grupo_id || '');
    setFormFotoUrl(item.foto_url || '');
    setModalAbierto(true);
  };

  const guardarAlumno = async (e) => {
    e.preventDefault();
    if (!formNombre || !formIdCorto || !formGrupoId) {
      alert('Por favor completa Nombre, ID Corto y Grupo.');
      return;
    }

    const payload = {
      nombre: formNombre.trim(),
      apellido_paterno: formApellidoPaterno.trim(),
      apellido_materno: formApellidoMaterno.trim(),
      id_corto: formIdCorto.trim(),
      grupo_id: formGrupoId,
      foto_url: formFotoUrl.trim() || null
    };

    if (modoEdicion) {
      const { error } = await supabase.from('alumnos').update(payload).eq('id', idAlumnoEditando);
      if (error) {
        alert('Error al actualizar: ' + error.message);
      } else {
        setModalAbierto(false);
        cargarDatosIniciales();
      }
    } else {
      const { error } = await supabase.from('alumnos').insert([payload]);
      if (error) {
        alert('Error al registrar: ' + error.message);
      } else {
        setModalAbierto(false);
        cargarDatosIniciales();
      }
    }
  };

  const eliminarAlumno = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${nombre}"? Se borrarán sus registros asociados.`)) {
      const { error } = await supabase.from('alumnos').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        if (alumnoSeleccionado?.id === id) setAlumnoSeleccionado(null);
        cargarDatosIniciales();
      }
    }
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

  const listaDesplegable = grupoSeleccionado ? alumnos : resumenGlobal;
  const alumnosMostrados = grupoSeleccionado ? alumnos : resumenGlobal;

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-md space-y-4">
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Escuela Secundaria - Reporte Escolar</h1>
        <p className="text-sm text-slate-600">Sistema Integral de Asistencias, Tareas y Evaluaciones</p>
        <hr className="my-2 border-slate-300" />
      </div>

      <div className="print:hidden flex flex-col gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setVistaGeneral(true);
                setAlumnoSeleccionado(null);
                setGrupoSeleccionado('');
              }}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm shadow transition flex items-center justify-center gap-2 ${
                vistaGeneral && !alumnoSeleccionado ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
              }`}
            >
              🌐 General
            </button>
            <button
              onClick={abrirModalNuevo}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg shadow text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              ➕ Nuevo Alumno
            </button>
          </div>

          <button
            onClick={imprimirPDF}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg shadow text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            🖨️ Imprimir PDF
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Filtrar Grupo:</label>
            <select 
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
              value={grupoSeleccionado}
              onChange={(e) => {
                setGrupoSeleccionado(e.target.value);
                setAlumnoSeleccionado(null);
                setVistaGeneral(true);
              }}
            >
              <option value="">-- Todos los grupos --</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Seleccionar Alumno:</label>
            <select 
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              value={alumnoSeleccionado ? alumnoSeleccionado.id_corto : ''}
              onChange={(e) => {
                const idCortoVal = e.target.value;
                if (!idCortoVal) {
                  setAlumnoSeleccionado(null);
                  return;
                }
                const alum = resumenGlobal.find(a => a.id_corto === idCortoVal);
                if (alum) {
                  setAlumnoSeleccionado(alum);
                  setVistaGeneral(false);
                }
              }}
              disabled={cargando}
            >
              <option value="">{cargando ? 'Cargando...' : '-- Seleccione alumno por ID y Nombre --'}</option>
              {listaDesplegable.map((a) => (
                <option key={a.id_corto} value={a.id_corto}>
                  [{a.id_corto}] - {a.nombreCompleto}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!alumnoSeleccionado && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">📊 Semáforo y Estatus General</h2>
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-semibold">
              Total: {alumnosMostrados.length}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto bg-white dark:bg-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white text-xs font-bold">
                  <th className="p-3 text-center w-28">ID Corto</th>
                  <th className="p-3">Alumno</th>
                  <th className="p-3 text-center hidden sm:table-cell w-28">Grupo</th>
                  <th className="p-3 text-center w-24">Asis/Faltas</th>
                  <th className="p-3 text-center w-32">Semáforo</th>
                  <th className="p-3 text-center w-36 print:hidden">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs sm:text-sm">
                {alumnosMostrados.length > 0 ? (
                  alumnosMostrados.map((item) => {
                    const sem = obtenerSemaforo(item.promedioGeneral);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                          <span className="bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {item.id_corto}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {item.foto_url ? (
                              <img 
                                src={item.foto_url} 
                                alt="" 
                                style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px', objectFit: 'cover', borderRadius: '50%' }} 
                                className="border border-slate-300 dark:border-slate-600 shrink-0" 
                              />
                            ) : (
                              <div style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }} className="rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {item.nombreCompleto?.[0] || 'A'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{item.nombreCompleto}</p>
                              <p className="text-[10px] text-slate-500 sm:hidden">{item.grupoNombre}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-center text-slate-600 dark:text-slate-300 font-medium hidden sm:table-cell">
                          {item.grupoNombre}
                        </td>

                        <td className="p-3 text-center font-medium whitespace-nowrap">
                          <span className="text-emerald-600 font-bold">{item.asistencias}</span>/<span className="text-rose-600 font-bold">{item.faltas}</span>
                        </td>

                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-bold ${sem.color}`}>
                            {sem.icon} <span className="hidden sm:inline">{sem.texto}</span>
                          </span>
                        </td>

                        <td className="p-3 text-center print:hidden space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setAlumnoSeleccionado(item);
                              setVistaGeneral(false);
                            }}
                            className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-2 py-1 rounded text-xs font-bold transition cursor-pointer"
                            title="Ver calificaciones"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => abrirModalEditar(item)}
                            className="bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 px-2 py-1 rounded text-xs font-bold transition cursor-pointer"
                            title="Modificar alumno"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminarAlumno(item.id, item.nombreCompleto)}
                            className="bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 px-2 py-1 rounded text-xs font-bold transition cursor-pointer"
                            title="Borrar alumno"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-500 italic">
                      {cargando ? 'Cargando alumnos...' : 'No hay alumnos registrados. Usa el botón "Nuevo Alumno" para empezar.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {alumnoSeleccionado && (
        <div className="space-y-4">
          <div className="print:hidden">
            <button
              onClick={() => setAlumnoSeleccionado(null)}
              className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition cursor-pointer"
            >
              ← Volver al Listado General
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            {alumnoSeleccionado.foto_url ? (
              <img 
                src={alumnoSeleccionado.foto_url} 
                alt="" 
                style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px', objectFit: 'cover', borderRadius: '50%' }} 
                className="border-2 border-white shadow-md shrink-0" 
              />
            ) : (
              <div style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px' }} className="rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md border-2 border-white shrink-0">
                {alumnoSeleccionado.nombreCompleto?.[0] || 'A'}
              </div>
            )}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{alumnoSeleccionado.nombreCompleto}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">ID Corto: <span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">{alumnoSeleccionado.id_corto}</span> | Grupo: {alumnoSeleccionado.grupoNombre}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <div className="grid grid-cols-6 bg-slate-800 text-white text-xs font-bold p-3 text-center">
              <div>Periodo</div>
              <div>Asis</div>
              <div>Mat</div>
              <div>Trab</div>
              <div>Exam</div>
              <div className="bg-slate-900">Calificación</div>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {calificaciones.length > 0 ? (
                calificaciones.map((cal, idx) => {
                  const sem = obtenerSemaforo(cal.calificacion_final);
                  return (
                    <div key={idx} className="grid grid-cols-6 p-3 text-xs sm:text-sm text-center items-center hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <div className="font-semibold text-slate-700 dark:text-slate-200 text-left">Periodo {cal.periodos_evaluacion?.numero_periodo || cal.periodo_evaluacion_id}</div>
                      <div className="dark:text-slate-300">{cal.promedio_asistencia ?? '-'}</div>
                      <div className="dark:text-slate-300">{cal.promedio_materiales ?? '-'}</div>
                      <div className="dark:text-slate-300">{cal.promedio_trabajos ?? '-'}</div>
                      <div className="dark:text-slate-300">{cal.promedio_examen ?? '-'}</div>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${sem.color}`}>
                          {sem.icon} {cal.calificacion_final ? Number(cal.calificacion_final).toFixed(1) : 'N/D'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-500 italic col-span-6">
                  Sin calificaciones capturadas.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear / Editar Alumno */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {modoEdicion ? '✏️ Modificar Alumno' : '➕ Registrar Nuevo Alumno'}
              </h3>
              <button 
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarAlumno} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre(s):</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Juan Carlos"
                  value={formNombre} 
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Apellido Paterno:</label>
                <input 
                  type="text" 
                  placeholder="Ej. Pérez"
                  value={formApellidoPaterno} 
                  onChange={(e) => setFormApellidoPaterno(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Apellido Materno:</label>
                <input 
                  type="text" 
                  placeholder="Ej. Gómez"
                  value={formApellidoMaterno} 
                  onChange={(e) => setFormApellidoMaterno(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">ID Corto (Ej. 3A-01-VL):</label>
                <input 
                  type="text" 
                  required
                  placeholder="3A-01-VL"
                  value={formIdCorto} 
                  onChange={(e) => setFormIdCorto(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-mono font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Grupo:</label>
                <select 
                  required
                  value={formGrupoId} 
                  onChange={(e) => setFormGrupoId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Selecciona un grupo --</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">URL de Foto (Opcional):</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={formFotoUrl} 
                  onChange={(e) => setFormFotoUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow"
                >
                  {modoEdicion ? 'Guardar Cambios' : 'Registrar Alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}