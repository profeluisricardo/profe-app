import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ModuloAlumnos() {
  const [grupos, setGrupos] = useState([]);
  const [gradoSeleccionado, setGradoSeleccionado] = useState(3);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estados del Modal / Formulario Alumnos
  const [modalAlumnoAbierto, setModalAlumnoAbierto] = useState(false);
  const [modoEdicionAlumno, setModoEdicionAlumno] = useState(false);
  const [idAlumnoEditando, setIdAlumnoEditando] = useState(null);

  // Campos de Alumno
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [nombre, setNombre] = useState('');
  const [idCorto, setIdCorto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nombreTutor, setNombreTutor] = useState('');
  const [whatsappTutor, setWhatsappTutor] = useState('');

  // Estados del Modal / Formulario Grupos
  const [modalGrupoAbierto, setModalGrupoAbierto] = useState(false);
  const [modoEdicionGrupo, setModoEdicionGrupo] = useState(false);
  const [idGrupoEditando, setIdGrupoEditando] = useState(null);
  const [nombreGrupoInput, setNombreGrupoInput] = useState('');
  const [gradoGrupoInput, setGradoGrupoInput] = useState(3);

  useEffect(() => {
    cargarGrupos();
  }, []);

  useEffect(() => {
    if (grupoSeleccionado) {
      cargarAlumnos(grupoSeleccionado);
    } else {
      setAlumnos([]);
    }
  }, [grupoSeleccionado]);

  const cargarGrupos = async (mantenerGrupoId = null) => {
    const { data, error } = await supabase.from('grupos').select('*').order('grado').order('nombre');
    if (!error && data) {
      setGrupos(data);
      if (mantenerGrupoId) {
        setGrupoSeleccionado(mantenerGrupoId);
      } else if (data.length > 0 && !grupoSeleccionado) {
        const primerGrado3 = data.find(g => g.grado === 3) || data[0];
        setGrupoSeleccionado(primerGrado3.id);
        setGradoSeleccionado(primerGrado3.grado);
      }
    }
  };

  const cargarAlumnos = async (gId) => {
    setCargando(true);
    const { data, error } = await supabase
      .from('alumnos')
      .select('*, grupos(nombre, grado)')
      .eq('grupo_id', gId)
      .order('apellido_paterno', { ascending: true });

    if (!error && data) {
      setAlumnos(data);
    } else {
      setAlumnos([]);
    }
    setCargando(false);
  };

  // --- LÓGICA DE GRUPOS ---
  const abrirModalNuevoGrupo = () => {
    setModoEdicionGrupo(false);
    setIdGrupoEditando(null);
    setNombreGrupoInput('');
    setGradoGrupoInput(gradoSeleccionado);
    setModalGrupoAbierto(true);
  };

  const abrirModalEditarGrupo = (grupoObj) => {
    setModoEdicionGrupo(true);
    setIdGrupoEditando(grupoObj.id);
    setNombreGrupoInput(grupoObj.nombre);
    setGradoGrupoInput(grupoObj.grado || gradoSeleccionado);
    setModalGrupoAbierto(true);
  };

  const guardarGrupo = async (e) => {
    e.preventDefault();
    if (!nombreGrupoInput.trim()) {
      alert('Escribe el nombre del grupo (ej. 3° A - Tutoría).');
      return;
    }

    const payload = {
      nombre: nombreGrupoInput.trim(),
      grado: Number(gradoGrupoInput)
    };

    if (modoEdicionGrupo) {
      const { error } = await supabase.from('grupos').update(payload).eq('id', idGrupoEditando);
      if (error) {
        alert('Error al actualizar grupo: ' + error.message);
      } else {
        setModalGrupoAbierto(false);
        cargarGrupos(idGrupoEditando);
      }
    } else {
      const { data, error } = await supabase.from('grupos').insert([payload]).select();
      if (error) {
        alert('Error al crear grupo: ' + error.message);
      } else {
        setModalGrupoAbierto(false);
        const nuevoId = data?.[0]?.id;
        if (nuevoId) {
          setGradoSeleccionado(Number(gradoGrupoInput));
          cargarGrupos(nuevoId);
        } else {
          cargarGrupos();
        }
      }
    }
  };

  const eliminarGrupo = async (grupoObj) => {
    if (window.confirm(`¿Estás seguro de eliminar el grupo "${grupoObj.nombre}"? Esto podría afectar a los alumnos vinculados.`)) {
      const { error } = await supabase.from('grupos').delete().eq('id', grupoObj.id);
      if (error) {
        alert('Error al eliminar grupo: ' + error.message);
      } else {
        setGrupoSeleccionado('');
        cargarGrupos();
      }
    }
  };

  // --- LÓGICA DE ALUMNOS ---
  const abrirModalNuevoAlumno = () => {
    setModoEdicionAlumno(false);
    setIdAlumnoEditando(null);
    setApellidoPaterno('');
    setApellidoMaterno('');
    setNombre('');
    setIdCorto('');
    setTelefono('');
    setNombreTutor('');
    setWhatsappTutor('');
    setModalAlumnoAbierto(true);
  };

  const abrirModalEditarAlumno = (alumno) => {
    setModoEdicionAlumno(true);
    setIdAlumnoEditando(alumno.id);
    setApellidoPaterno(alumno.apellido_paterno || '');
    setApellidoMaterno(alumno.apellido_materno || '');
    setNombre(alumno.nombre || '');
    setIdCorto(alumno.id_corto || '');
    setTelefono(alumno.telefono || '');
    setNombreTutor(alumno.nombre_tutor || '');
    setWhatsappTutor(alumno.whatsapp_tutor || '');
    setModalAlumnoAbierto(true);
  };

  const guardarAlumno = async (e) => {
    e.preventDefault();
    if (!apellidoPaterno || !nombre || !idCorto || !grupoSeleccionado) {
      alert('Completa Apellido Paterno, Nombre, ID Corto y asegúrate de tener un grupo seleccionado.');
      return;
    }

    const payload = {
      apellido_paterno: apellidoPaterno.trim(),
      apellido_materno: apellidoMaterno.trim() || null,
      nombre: nombre.trim(),
      id_corto: idCorto.trim(),
      grupo_id: Number(grupoSeleccionado),
      telefono: telefono.trim() || null,
      nombre_tutor: nombreTutor.trim() || null,
      whatsapp_tutor: whatsappTutor.trim() || null
    };

    if (modoEdicionAlumno) {
      const { error } = await supabase.from('alumnos').update(payload).eq('id', idAlumnoEditando);
      if (error) {
        alert('Error al actualizar alumno: ' + error.message);
      } else {
        setModalAlumnoAbierto(false);
        cargarAlumnos(grupoSeleccionado);
      }
    } else {
      const { error } = await supabase.from('alumnos').insert([payload]);
      if (error) {
        alert('Error al registrar alumno: ' + error.message);
      } else {
        setModalAlumnoAbierto(false);
        cargarAlumnos(grupoSeleccionado);
      }
    }
  };

  const eliminarAlumno = async (id, nombreCompleto) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${nombreCompleto}?`)) {
      const { error } = await supabase.from('alumnos').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        cargarAlumnos(grupoSeleccionado);
      }
    }
  };

  const gruposFiltrados = grupos.filter(g => g.grado === gradoSeleccionado);
  const grupoActualObj = grupos.find(g => g.id === grupoSeleccionado);

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-md space-y-4">
      
      {/* Cabecera: Selector Único de Grado */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Grado Escolar:
          </label>
          <select
            value={gradoSeleccionado}
            onChange={(e) => {
              const nuevoGrado = Number(e.target.value);
              setGradoSeleccionado(nuevoGrado);
              const primerGrupo = grupos.find(g => g.grado === nuevoGrado);
              if (primerGrupo) setGrupoSeleccionado(primerGrupo.id);
              else setGrupoSeleccionado('');
            }}
            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none cursor-pointer"
          >
            <option value={1}>1er Grado</option>
            <option value={2}>2do Grado</option>
            <option value={3}>3er Grado</option>
          </select>
        </div>

        <button
          onClick={abrirModalNuevoGrupo}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          ➕ Agregar Grupo / Tutoría
        </button>
      </div>

      {/* Contenedor de Grupos del Grado Seleccionado */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Grupos disponibles en {numGradoTexto(gradoSeleccionado)} Grado:
        </span>

        <div className="flex flex-wrap gap-2">
          {gruposFiltrados.length > 0 ? (
            gruposFiltrados.map((g) => (
              <div key={g.id} className="flex items-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden shadow-sm">
                <button
                  onClick={() => setGrupoSeleccionado(g.id)}
                  className={`px-3 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                    grupoSeleccionado === g.id
                      ? 'bg-slate-900 text-white dark:bg-blue-600'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  {g.nombre}
                </button>
                <button
                  onClick={() => abrirModalEditarGrupo(g)}
                  title="Renombrar grupo"
                  className="px-2 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-600 text-xs border-l border-slate-200 dark:border-slate-600 transition cursor-pointer"
                >
                  ✏️
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic py-2">No hay grupos creados en este grado. Agrega uno con el botón superior.</p>
          )}
        </div>

        {/* Barra de estado del grupo activo y alta de alumnos */}
        {grupoActualObj && (
          <div className="flex flex-wrap justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700 gap-2">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span>Activo: <strong className="text-blue-600 dark:text-blue-400 text-sm">{grupoActualObj.nombre}</strong></span>
              <button 
                onClick={() => eliminarGrupo(grupoActualObj)} 
                className="text-rose-500 hover:text-rose-700 text-xs font-bold underline cursor-pointer ml-2"
              >
                Eliminar grupo
              </button>
            </div>
            <button
              onClick={abrirModalNuevoAlumno}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              ➕ Nuevo Alumno en {grupoActualObj.nombre}
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Alumnos */}
      {grupoSeleccionado ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white text-xs font-bold">
                <th className="p-3 text-center w-24">ID Corto</th>
                <th className="p-3">Apellidos y Nombre</th>
                <th className="p-3 text-center w-32">Tutor / Contrato</th>
                <th className="p-3 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              {cargando ? (
                <tr><td colSpan="4" className="p-6 text-center text-slate-500 italic">Cargando alumnos...</td></tr>
              ) : alumnos.length > 0 ? (
                alumnos.map((alum) => {
                  const nombreCompleto = `${alum.apellido_paterno} ${alum.apellido_materno || ''} ${alum.nombre}`.trim();
                  return (
                    <tr key={alum.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                        <span className="bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-xs">
                          {alum.id_corto}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-100">
                        {nombreCompleto}
                      </td>
                      <td className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                        {alum.nombre_tutor || 'Sin registrar'}
                      </td>
                      <td className="p-3 text-center space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => abrirModalEditarAlumno(alum)}
                          className="bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarAlumno(alum.id, nombreCompleto)}
                          className="bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-500 italic">
                    No hay alumnos registrados en este grupo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Modal para Crear / Editar Grupo */}
      {modalGrupoAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {modoEdicionGrupo ? '✏️ Renombrar Grupo' : '➕ Nuevo Grupo / Tutoría'}
              </h3>
              <button onClick={() => setModalGrupoAbierto(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={guardarGrupo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre o Etiqueta:</label>
                <input 
                  type="text" required placeholder="Ej. 3° A - Tutoría"
                  value={nombreGrupoInput} onChange={(e) => setNombreGrupoInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Grado Escolar:</label>
                <select 
                  value={gradoGrupoInput} onChange={(e) => setGradoGrupoInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                >
                  <option value={1}>1er Grado</option>
                  <option value={2}>2do Grado</option>
                  <option value={3}>3er Grado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setModalGrupoAbierto(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow">Guardar Grupo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear / Editar Alumno */}
      {modalAlumnoAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {modoEdicionAlumno ? '✏️ Editar Alumno' : `➕ Registrar Alumno en ${grupoActualObj?.nombre}`}
              </h3>
              <button onClick={() => setModalAlumnoAbierto(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={guardarAlumno} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Apellido Paterno:</label>
                <input 
                  type="text" required placeholder="Ej. Pérez"
                  value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Apellido Materno (Opcional):</label>
                <input 
                  type="text" placeholder="Ej. Gómez"
                  value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre(s):</label>
                <input 
                  type="text" required placeholder="Ej. Juan Carlos"
                  value={nombre} onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">ID Corto:</label>
                <input 
                  type="text" required placeholder="Ej. 3A-01-VL"
                  value={idCorto} onChange={(e) => setIdCorto(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre del Tutor:</label>
                <input 
                  type="text" placeholder="Nombre del padre o tutor"
                  value={nombreTutor} onChange={(e) => setNombreTutor(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">WhatsApp Tutor:</label>
                <input 
                  type="text" placeholder="Número de contacto"
                  value={whatsappTutor} onChange={(e) => setWhatsappTutor(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setModalAlumnoAbierto(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow">Guardar Alumno</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function numGradoTexto(n) {
  if (n === 1) return '1er';
  if (n === 2) return '2do';
  return '3er';
}