import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function CapturaCalificaciones() {
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState('');
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');

  // Rubros de captura
  const [asistencia, setAsistencia] = useState('');
  const [materiales, setMateriales] = useState('');
  const [trabajos, setTrabajos] = useState('');
  const [examen, setExamen] = useState('');

  // Modalidades por rubro ('directa' o 'cumplimiento')
  const [modAsistencia, setModAsistencia] = useState('directa');
  const [modMateriales, setModMateriales] = useState('directa');
  const [modTrabajos, setModTrabajos] = useState('directa');
  const [modExamen, setModExamen] = useState('directa');

  const [calificacionFinal, setCalificacionFinal] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (grupoSeleccionado) {
      cargarAlumnosPorGrupo(grupoSeleccionado);
    } else {
      setAlumnos([]);
      setAlumnoSeleccionado('');
    }
  }, [grupoSeleccionado]);

  // Calcular la calificación final en tiempo real cuando cambian los rubros
  useEffect(() => {
    const a = parseFloat(asistencia) || 0;
    const m = parseFloat(materiales) || 0;
    const t = parseFloat(trabajos) || 0;
    const e = parseFloat(examen) || 0;

    const final = (a * 0.15) + (m * 0.15) + (t * 0.40) + (e * 0.30);
    setCalificacionFinal(final.toFixed(1));
  }, [asistencia, materiales, trabajos, examen]);

  // Si ya se seleccionó alumno y periodo, buscamos calificaciones y modalidades previas
  useEffect(() => {
    if (alumnoSeleccionado && periodoSeleccionado) {
      cargarCalificacionExistente();
    } else {
      limpiarCamposCalificacion();
    }
  }, [alumnoSeleccionado, periodoSeleccionado]);

  const cargarDatosIniciales = async () => {
    const { data: gruposData } = await supabase.from('grupos').select('*').order('nombre');
    if (gruposData) setGrupos(gruposData);

    const { data: periodosData } = await supabase.from('periodos_evaluacion').select('*').order('numero_periodo');
    if (periodosData) setPeriodos(periodosData);
  };

  const cargarAlumnosPorGrupo = async (grupoId) => {
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('grupo_id', grupoId)
      .order('apellido_paterno', { ascending: true });

    if (!error && data) {
      setAlumnos(data);
    } else {
      setAlumnos([]);
    }
  };

  const cargarCalificacionExistente = async () => {
    const { data, error } = await supabase
      .from('evaluaciones_consolidadas')
      .select('*')
      .eq('alumno_id', alumnoSeleccionado)
      .eq('periodo_evaluacion_id', periodoSeleccionado)
      .maybeSingle();

    if (!error && data) {
      setAsistencia(data.promedio_asistencia ?? '');
      setMateriales(data.promedio_materiales ?? '');
      setTrabajos(data.promedio_trabajos ?? '');
      setExamen(data.promedio_examen ?? '');
      setCalificacionFinal(data.calificacion_final ?? 0);

      setModAsistencia(data.mod_asistencia ?? 'directa');
      setModMateriales(data.mod_materiales ?? 'directa');
      setModTrabajos(data.mod_trabajos ?? 'directa');
      setModExamen(data.mod_examen ?? 'directa');
    } else {
      limpiarCamposCalificacion();
    }
  };

  const limpiarCamposCalificacion = () => {
    setAsistencia('');
    setMateriales('');
    setTrabajos('');
    setExamen('');
    setCalificacionFinal(0);
    setModAsistencia('directa');
    setModMateriales('directa');
    setModTrabajos('directa');
    setModExamen('directa');
  };

  const guardarCalificaciones = async (e) => {
    e.preventDefault();
    if (!alumnoSeleccionado || !periodoSeleccionado) {
      alert('Selecciona un alumno y un periodo de evaluación.');
      return;
    }

    setGuardando(true);
    setMensajeExito('');

    const payload = {
      alumno_id: alumnoSeleccionado,
      periodo_evaluacion_id: periodoSeleccionado,
      promedio_asistencia: asistencia === '' ? null : parseFloat(asistencia),
      promedio_materiales: materiales === '' ? null : parseFloat(materiales),
      promedio_trabajos: trabajos === '' ? null : parseFloat(trabajos),
      promedio_examen: examen === '' ? null : parseFloat(examen),
      calificacion_final: parseFloat(calificacionFinal),
      mod_asistencia: modAsistencia,
      mod_materiales: modMateriales,
      mod_trabajos: modTrabajos,
      mod_examen: modExamen
    };

    const { data: existente } = await supabase
      .from('evaluaciones_consolidadas')
      .select('id')
      .eq('alumno_id', alumnoSeleccionado)
      .eq('periodo_evaluacion_id', periodoSeleccionado)
      .maybeSingle();

    let errorSupabase = null;

    if (existente) {
      const { error } = await supabase
        .from('evaluaciones_consolidadas')
        .update(payload)
        .eq('id', existente.id);
      errorSupabase = error;
    } else {
      const { error } = await supabase
        .from('evaluaciones_consolidadas')
        .insert([payload]);
      errorSupabase = error;
    }

    setGuardando(false);

    if (errorSupabase) {
      alert('Error al guardar calificaciones: ' + errorSupabase.message);
    } else {
      setMensajeExito('✅ ¡Calificaciones y modalidades guardadas exitosamente!');
      setTimeout(() => setMensajeExito(''), 4000);
    }
  };

  return (
    <div style={{ 
      background: '#090d16', 
      padding: '1.5rem', 
      borderRadius: '1.25rem', 
      border: '1px solid rgba(255,255,255,0.08)', 
      width: '100%', 
      maxWidth: '750px', 
      color: '#f3f4f6', 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
      margin: '0 auto'
    }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-white/10 pb-3 gap-2">
        <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
          📝 Captura y Edición de Calificaciones
        </h2>
        <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
          Individual
        </span>
      </div>

      <form onSubmit={guardarCalificaciones} className="space-y-4">
        {/* Selectores de Grupo, Alumno y Periodo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-white/10 shadow-sm" style={{ background: '#020617' }}>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">1. Seleccionar Grupo:</label>
            <select
              value={grupoSeleccionado}
              onChange={(e) => {
                setGrupoSeleccionado(e.target.value);
                setAlumnoSeleccionado('');
              }}
              style={{ background: '#090d16', borderColor: 'rgba(255,255,255,0.1)' }}
              className="w-full p-2.5 border rounded-lg text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="">-- Elige un grupo --</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">2. Seleccionar Periodo:</label>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              style={{ background: '#090d16', borderColor: 'rgba(255,255,255,0.1)' }}
              className="w-full p-2.5 border rounded-lg text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="">-- Elige un periodo --</option>
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>Periodo {p.numero_periodo} {p.descripcion ? `- ${p.descripcion}` : ''}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 pt-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">3. Seleccionar Alumno:</label>
            <select
              value={alumnoSeleccionado}
              onChange={(e) => setAlumnoSeleccionado(e.target.value)}
              disabled={!grupoSeleccionado}
              style={{ background: '#090d16', borderColor: 'rgba(255,255,255,0.1)' }}
              className="w-full p-2.5 border rounded-lg text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50"
            >
              <option value="">{!grupoSeleccionado ? '-- Primero elige un grupo --' : '-- Elige un alumno --'}</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.id_corto}] {a.apellido_paterno} {a.apellido_materno}, {a.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filas Horizontales de Rubros y Modalidades */}
        <div className="p-4 rounded-xl border border-white/10 shadow-sm space-y-3" style={{ background: '#020617' }}>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 border-b border-white/10 pb-2">
            Rubros de Evaluación y Modalidad (Escala 0 al 10)
          </h3>
          
          <div className="space-y-2">
            {/* Asistencia */}
            <div className="p-3 rounded-lg border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" style={{ background: '#090d16' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1">
                <span className="text-xs font-black text-slate-200 uppercase tracking-widest min-w-[95px]">Asistencia:</span>
                <select 
                  value={modAsistencia} 
                  onChange={(e) => setModAsistencia(e.target.value)}
                  style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                  className="text-[10px] text-amber-400 font-bold p-1.5 rounded border outline-none cursor-pointer"
                >
                  <option value="directa">Calificación Directa</option>
                  <option value="cumplimiento">Por Cumplimiento</option>
                </select>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                value={asistencia}
                onChange={(e) => setAsistencia(e.target.value)}
                disabled={!alumnoSeleccionado || !periodoSeleccionado}
                style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                className="w-full sm:w-24 p-2 border rounded-lg text-amber-400 font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amber-500 outline-none disabled:opacity-50"
              />
            </div>

            {/* Materiales */}
            <div className="p-3 rounded-lg border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" style={{ background: '#090d16' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1">
                <span className="text-xs font-black text-slate-200 uppercase tracking-widest min-w-[95px]">Materiales:</span>
                <select 
                  value={modMateriales} 
                  onChange={(e) => setModMateriales(e.target.value)}
                  style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                  className="text-[10px] text-amber-400 font-bold p-1.5 rounded border outline-none cursor-pointer"
                >
                  <option value="directa">Calificación Directa</option>
                  <option value="cumplimiento">Por Cumplimiento</option>
                </select>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                value={materiales}
                onChange={(e) => setMateriales(e.target.value)}
                disabled={!alumnoSeleccionado || !periodoSeleccionado}
                style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                className="w-full sm:w-24 p-2 border rounded-lg text-amber-400 font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amber-500 outline-none disabled:opacity-50"
              />
            </div>

            {/* Trabajos */}
            <div className="p-3 rounded-lg border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" style={{ background: '#090d16' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1">
                <span className="text-xs font-black text-slate-200 uppercase tracking-widest min-w-[95px]">Trabajos:</span>
                <select 
                  value={modTrabajos} 
                  onChange={(e) => setModTrabajos(e.target.value)}
                  style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                  className="text-[10px] text-amber-400 font-bold p-1.5 rounded border outline-none cursor-pointer"
                >
                  <option value="directa">Calificación Directa</option>
                  <option value="cumplimiento">Por Cumplimiento (Checklist)</option>
                </select>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                value={trabajos}
                onChange={(e) => setTrabajos(e.target.value)}
                disabled={!alumnoSeleccionado || !periodoSeleccionado}
                style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                className="w-full sm:w-24 p-2 border rounded-lg text-amber-400 font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amber-500 outline-none disabled:opacity-50"
              />
            </div>

            {/* Examen */}
            <div className="p-3 rounded-lg border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" style={{ background: '#090d16' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1">
                <span className="text-xs font-black text-slate-200 uppercase tracking-widest min-w-[95px]">Examen:</span>
                <select 
                  value={modExamen} 
                  onChange={(e) => setModExamen(e.target.value)}
                  style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                  className="text-[10px] text-amber-400 font-bold p-1.5 rounded border outline-none cursor-pointer"
                >
                  <option value="directa">Calificación Directa</option>
                  <option value="cumplimiento">Por Cumplimiento</option>
                </select>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                value={examen}
                onChange={(e) => setExamen(e.target.value)}
                disabled={!alumnoSeleccionado || !periodoSeleccionado}
                style={{ background: '#020617', borderColor: 'rgba(255,255,255,0.1)' }}
                className="w-full sm:w-24 p-2 border rounded-lg text-amber-400 font-mono font-bold text-center text-xs focus:ring-1 focus:ring-amber-500 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Calificación Final Calculada */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">Calificación Final Calculada:</span>
            <span className="text-base font-mono font-bold px-3 py-1 bg-amber-950/60 text-amber-400 rounded-lg border border-amber-800/50">
              {calificacionFinal}
            </span>
          </div>
        </div>

        {mensajeExito && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-bold rounded-lg text-center">
            {mensajeExito}
          </div>
        )}

        <button
          type="submit"
          disabled={!alumnoSeleccionado || !periodoSeleccionado || guardando}
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none' }}
          className="w-full py-3 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition text-xs sm:text-sm cursor-pointer disabled:opacity-50 hover:brightness-110"
        >
          {guardando ? 'Guardando...' : '💾 Guardar Calificaciones'}
        </button>
      </form>
    </div>
  );
}