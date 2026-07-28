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
  
  // Parámetros para el alumno
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
    if (!val || val === 0) return { color: 'bg-slate-800 text-slate-400 border-slate-700', icon: '⚪', texto: 'Sin evaluar' };
    if (val >= 8.5) return { color: 'bg-emerald-950 text-emerald-400 border-emerald-800', icon: '🟢', texto: 'Excelente' };
    if (val >= 6.0) return { color: 'bg-amber-950 text-amber-400 border-amber-800', icon: '🟡', texto: 'Regular' };
    return { color: 'bg-rose-950 text-rose-400 border-rose-800', icon: '🔴', texto: 'En Riesgo' };
  };

  const imprimirPDF = () => {
    window.print();
  };

  const listaDesplegable = grupoSeleccionado ? alumnos : resumenGlobal;
  const alumnosMostrados = grupoSeleccionado ? alumnos : resumenGlobal;

  return (
    <div style={{ 
      background: '#090d16', 
      padding: '1.5rem', 
      borderRadius: '1.25rem', 
      border: '1px solid rgba(255,255,255,0.08)', 
      width: '100%', 
      maxWidth: '950px', 
      color: '#f3f4f6', 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
      margin: '0 auto'
    }}>
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold text-white">Escuela Secundaria - Reporte Escolar</h1>
        <p className="text-sm text-slate-400">Sistema Integral de Asistencias, Tareas y Evaluaciones</p>
        <hr className="my-2 border-slate-800" />
      </div>

      {/* Controles superiores */}
      <div className="print:hidden flex flex-col gap-3 p-4 rounded-xl border border-white/10 shadow-sm" style={{ background: '#020617' }}>
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setVistaGeneral(true);
                setAlumnoSeleccionado(null);
                setGrupoSeleccionado('');
              }}
              style={{
                background: vistaGeneral && !alumnoSeleccionado ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff'
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              🌐 General
            </button>
            <button
              onClick={abrirModalNuevo}
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none' }}
              className="flex-1 sm:flex-none text-white font-black px-4 py-2 rounded-lg shadow text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
            >
              ➕ Nuevo Alumno
            </button>
          </div>

          <button
            onClick={imprimirPDF}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            className="w-full sm:w-auto hover:bg-white/10 text-white font-black px-5 py-2 rounded-lg shadow text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            🖨️ Imprimir PDF
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filtrar Grupo:</label>
            <select 
              style={{ background: '#090d16', borderColor: 'rgba(255,255,255,0.1)' }}
              className="w-full p-2.5 border rounded-lg text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seleccionar Alumno:</label>
            <select 
              style={{ background: '#090d16', borderColor: 'rgba(255,255,255,0.1)' }}
              className="w-full p-2.5 border rounded-lg text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50"
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
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-300">📊 Semáforo y Estatus General</h2>
            <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
              Total: {alumnosMostrados.length}
            </span>
          </div>

          <div className="rounded-xl border border-white/10 shadow-sm overflow-x-auto" style={{ background: '#020617' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#090d16] text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-white/10">
                  <th className="p-3 text-center w-28">ID Corto</th>
                  <th className="p-3">Alumno</th>
                  <th className="p-3 text-center hidden sm:table-cell w-28">Grupo</th>
                  <th className="p-3 text-center w-24">Asis/Faltas</th>
                  <th className="p-3 text-center w-32">Semáforo</th>
                  <th className="p-3 text-center w-36 print:hidden">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {alumnosMostrados.length > 0 ? (
                  alumnosMostrados.map((item) => {
                    const sem = obtenerSemaforo(item.promedioGeneral);
                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-3 text-center font-mono font-bold text-amber-400">
                          <span className="bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                            {item.id_corto}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {item.foto_url ? (
                              <img 
                                src={item.foto_url} 
                                alt="" 
                                style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px', objectFit: 'cover', borderRadius: '50%' }} 
                                className="border border-white/10 shrink-0" 
                              />
                            ) : (
                              <div style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }} className="rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                                {item.nombreCompleto?.[0] || 'A'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{item.nombreCompleto}</p>
                              <p className="text-[10px] text-slate-400 sm:hidden">{item.grupoNombre}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-center text-slate-300 font-medium hidden sm:table-cell">
                          {item.grupoNombre}
                        </td>

                        <td className="p-3 text-center font-medium whitespace-nowrap">
                          <span className="text-emerald-400 font-black">{item.asistencias}</span>/<span className="text-rose-400 font-black">{item.faltas}</span>
                        </td>

                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${sem.color}`}>
                            {sem.icon} <span className="hidden sm:inline">{sem.texto}</span>
                          </span>
                        </td>

                        <td className="p-3 text-center print:hidden space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setAlumnoSeleccionado(item);
                              setVistaGeneral(false);
                            }}
                            className="bg-blue-950/60 text-blue-400 hover:bg-blue-900 border border-blue-800/40 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => abrirModalEditar(item)}
                            className="bg-amber-950/60 text-amber-400 hover:bg-amber-900 border border-amber-800/40 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminarAlumno(item.id, item.nombreCompleto)}
                            className="bg-rose-950/60 text-rose-400 hover:bg-rose-900 border border-rose-800/40 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400 italic">
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
        <div className="space-y-4 mt-4">
          <div className="print:hidden">
            <button
              onClick={() => setAlumnoSeleccionado(null)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              className="hover:bg-white/10 text-white font-black px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer"
            >
              ← Volver al Listado General
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-white/10 shadow-sm" style={{ background: '#020617' }}>
            {alumnoSeleccionado.foto_url ? (
              <img 
                src={alumnoSeleccionado.foto_url} 
                alt="" 
                style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px', objectFit: 'cover', borderRadius: '50%' }} 
                className="border-2 border-white/10 shadow-md shrink-0" 
              />
            ) : (
              <div style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', maxWidth: '64px', maxHeight: '64px' }} className="rounded-full bg-amber-600 text-white flex items-center justify-center text-xl font-black shadow-md border-2 border-white/10 shrink-0">
                {alumnoSeleccionado.nombreCompleto?.[0] || 'A'}
              </div>
            )}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-base font-black uppercase tracking-wider text-white">{alumnoSeleccionado.nombreCompleto}</h2>
              <p className="text-xs text-slate-400 mt-0.5">ID Corto: <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">{alumnoSeleccionado.id_corto}</span> | Grupo: {alumnoSeleccionado.grupoNombre}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 shadow-sm overflow-hidden" style={{ background: '#020617' }}>
            <div className="grid grid-cols-6 bg-[#090d16] text-slate-400 text-[10px] font-black uppercase tracking-widest p-3 text-center border-b border-white/10">
              <div>Periodo</div>
              <div>Asis</div>
              <div>Mat</div>
              <div>Trab</div>
              <div>Exam</div>
              <div className="bg-[#020617] text-amber-400">Calificación</div>
            </div>
            <div className="divide-y divide-white/5">
              {calificaciones.length > 0 ? (
                calificaciones.map((cal, idx) => {
                  const sem = obtenerSemaforo(cal.calificacion_final);
                  return (
                    <div key={idx} className="grid grid-cols-6 p-3 text-xs text-center items-center hover:bg-white/[0.02] transition">
                      <div className="font-bold text-white text-left">Periodo {cal.periodos_evaluacion?.numero_periodo || cal.periodo_evaluacion_id}</div>
                      <div className="text-slate-300">{cal.promedio_asistencia ?? '-'}</div>
                      <div className="text-slate-300">{cal.promedio_materiales ?? '-'}</div>
                      <div className="text-slate-300">{cal.promedio_trabajos ?? '-'}</div>
                      <div className="text-slate-300">{cal.promedio_examen ?? '-'}</div>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${sem.color}`}>
                          {sem.icon} {cal.calificacion_final ? Number(cal.calificacion_final).toFixed(1) : 'N/D'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-400 italic col-span-6">
                  Sin calificaciones capturadas.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear / Editar Alumno */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)' }} className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-white">
                {modoEdicion ? '✏️ Modificar Alumno' : '➕ Registrar Nuevo Alumno'}
              </h3>
              <button 
                onClick={() => setModalAbierto(false)}
                style={{ background: 'rgba(255,255,255,0.08)' }}
                className="text-slate-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarAlumno} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre(s):</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Juan Carlos"
                  value={formNombre} 
                  onChange={(e) => setFormNombre(e.target.value)}
                  style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                  className="w-full p-2.5 border rounded-lg text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Apellido Paterno:</label>
                <input 
                  type="text" 
                  placeholder="Ej. Pérez"
                  value={formApellidoPaterno} 
                  onChange={(e) => setFormApellidoPaterno(e.target.value)}
                  style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                  className="w-full p-2.5 border rounded-lg text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Apellido Materno:</label>
                <input 
                  type="text" 
                  placeholder="Ej. Gómez"
                  value={formApellidoMaterno} 
                  onChange={(e) => setFormApellidoMaterno(e.target.value)}
                  style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                  className="w-full p-2.5 border rounded-lg text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Corto (Ej. 3A-01-VL):</label>
                <input 
                  type="text" 
                  required
                  placeholder="3A-01-VL"
                  value={formIdCorto} 
                  onChange={(e) => setFormIdCorto(e.target.value)}
                  style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                  className="w-full p-2.5 border rounded-lg text-amber-400 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Grupo:</label>
                <select 
                  required
                  value={formGrupoId} 
                  onChange={(e) => setFormGrupoId(e.target.value)}
                  style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                  className="w-full p-2.5 border rounded-lg text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">-- Selecciona un grupo --</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">URL de Foto (Opcional):</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={formFotoUrl} 
                  onChange={(e) => setFormFotoUrl(e.target.value)}
                  style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                  className="w-full p-2.5 border rounded-lg text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  className="px-4 py-2 rounded-lg text-slate-300 text-xs font-black uppercase tracking-wider hover:bg-white/10 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none' }}
                  className="px-5 py-2 rounded-lg text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow"
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