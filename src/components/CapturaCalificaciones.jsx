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

    // Fórmula ponderada configurable o promedio simple (ejemplo ponderado equilibrado o directo)
    // Puedes ajustar los pesos según tus criterios pedagógicos:
    const final = (a * 0.15) + (m * 0.15) + (t * 0.40) + (e * 0.30);
    setCalificacionFinal(final.toFixed(1));
  }, [asistencia, materiales, trabajos, examen]);

  // Si ya se seleccionó alumno y periodo, buscamos si ya existen calificaciones previas para cargarlas
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
      calificacion_final: parseFloat(calificacionFinal)
    };

    // Verificamos si ya existe el registro para hacer Upsert o Update/Insert
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
      setMensajeExito('✅ ¡Calificaciones guardadas exitosamente!');
      setTimeout(() => setMensajeExito(''), 4000);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-md space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">📝 Captura y Edición de Calificaciones</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Registra o actualiza los rubros por periodo para calcular la calificación final.</p>
      </div>

      <form onSubmit={guardarCalificaciones} className="space-y-4">
        {/* Selectores de Grupo, Alumno y Periodo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">1. Seleccionar Grupo:</label>
            <select
              value={grupoSeleccionado}
              onChange={(e) => {
                setGrupoSeleccionado(e.target.value);
                setAlumnoSeleccionado('');
              }}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Elige un grupo --</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">2. Seleccionar Periodo:</label>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Elige un periodo --</option>
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>Periodo {p.numero_periodo} {p.descripcion ? `- ${p.descripcion}` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">3. Seleccionar Alumno:</label>
          <select
            value={alumnoSeleccionado}
            onChange={(e) => setAlumnoSeleccionado(e.target.value)}
            disabled={!grupoSeleccionado}
            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">{!grupoSeleccionado ? '-- Primero elige un grupo --' : '-- Elige un alumno --'}</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.id_corto}] {a.apellido_paterno} {a.apellido_materno}, {a.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Inputs de Rubros */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rubros de Evaluación (Escala 0 al 10)</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Asistencia:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                value={asistencia}
                onChange={(e) => setAsistencia(e.target.value)}
                disabled={!alumnoSeleccionado || !periodoSeleccionado}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-center font-bold disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Materiales:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                value={materiales}
                onChange={(e) => setMateriales(e.target.value)}
                disabled={!alumnoSeleccionado || !periodoSeleccionado}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-center font-bold disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Trabajos:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                value={trabajos}
                onChange={(e) => setTrabajos(e.target.value)}
                disabled={!alumnoSeleccionado || !periodoSeleccionado}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-center font-bold disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Examen:</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                value={examen}
                onChange={(e) => setExamen(e.target.value)}
                disabled={!alumnoSeleccionado || !periodoSeleccionado}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-center font-bold disabled:opacity-50"
              />
            </div>
          </div>

          {/* Calificación Final Calculada */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Calificación Final Calculada:</span>
            <span className="text-lg font-mono font-bold px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-300 dark:border-blue-800">
              {calificacionFinal}
            </span>
          </div>
        </div>

        {mensajeExito && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-lg text-center">
            {mensajeExito}
          </div>
        )}

        <button
          type="submit"
          disabled={!alumnoSeleccionado || !periodoSeleccionado || guardando}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition text-xs sm:text-sm cursor-pointer disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : '💾 Guardar Calificaciones'}
        </button>
      </form>
    </div>
  );
}