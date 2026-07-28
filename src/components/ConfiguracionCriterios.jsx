import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ConfiguracionCriterios({ alCerrar }) {
    const [criteriosActuales, setCriteriosActuales] = useState([]);
    const [btnAgregadoAnimacion, setBtnAgregadoAnimacion] = useState(false);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarConfiguracionCriterios();
    }, []);

    async function cargarConfiguracionCriterios() {
        setCargando(true);
        const { data, error } = await supabase
            .from('criterios_evaluacion')
            .select('*')
            .eq('activo', true)
            .order('id', { ascending: true });

        if (error) {
            console.error('Error al cargar criterios:', error);
            setCargando(false);
            return;
        }

        const datosConId = (data || []).map(item => ({
            ...item,
            tempId: item.id ? `db-${item.id}` : `temp-${Math.random()}`
        }));

        setCriteriosActuales(datosConId);
        setCargando(false);
    }

    const actualizarNombre = (index, nuevoNombre) => {
        const nuevos = [...criteriosActuales];
        nuevos[index].nombre_criterio = nuevoNombre;
        setCriteriosActuales(nuevos);
    };

    const actualizarPorcentaje = (index, nuevoValor) => {
        const nuevos = [...criteriosActuales];
        nuevos[index].porcentaje = parseFloat(nuevoValor) || 0;
        setCriteriosActuales(nuevos);
    };

    const actualizarModoEvaluacion = (index, nuevoModo) => {
        const nuevos = [...criteriosActuales];
        nuevos[index].modo_evaluacion = nuevoModo;
        setCriteriosActuales(nuevos);
    };

    const agregarFila = () => {
        const nuevoCriterio = { 
            id: null, 
            tempId: `temp-${Date.now()}`, 
            nombre_criterio: '', 
            porcentaje: 0, 
            modo_evaluacion: 'cumplimiento', 
            activo: true 
        };
        
        setCriteriosActuales(prevCriterios => [nuevoCriterio, ...prevCriterios]);

        setBtnAgregadoAnimacion(true);
        setTimeout(() => {
            setBtnAgregadoAnimacion(false);
        }, 600);
    };

    const eliminarFila = (index) => {
        const nuevos = criteriosActuales.filter((_, i) => i !== index);
        setCriteriosActuales(nuevos);
    };

    const sumaTotal = criteriosActuales.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);

    async function guardarCriterios() {
        if (sumaTotal !== 100) {
            alert('La suma total de los porcentajes debe ser exactamente 100%.');
            return;
        }

        for (const c of criteriosActuales) {
            if (!c.nombre_criterio || c.nombre_criterio.trim() === '') {
                alert('Todos los rubros o criterios deben tener un nombre válido.');
                return;
            }
        }

        try {
            const { error: errorBorrar } = await supabase
                .from('criterios_evaluacion')
                .delete()
                .neq('id', 0);

            if (errorBorrar) {
                console.error("Error al limpiar registros anteriores:", errorBorrar);
                alert("Ocurrió un error al actualizar los registros en la base de datos.");
                return;
            }

            for (const criterio of criteriosActuales) {
                const payload = {
                    nombre_criterio: criterio.nombre_criterio.trim(),
                    porcentaje: Number(criterio.porcentaje),
                    modo_evaluacion: criterio.modo_evaluacion || 'cumplimiento',
                    activo: true
                };

                const { error: errorInsert } = await supabase
                    .from('criterios_evaluacion')
                    .insert([payload]);

                if (errorInsert) {
                    console.error("Error al insertar criterio:", errorInsert);
                }
            }

            alert('¡Configuración de criterios guardada con éxito!');
            if (alCerrar) alCerrar();
            cargarConfiguracionCriterios();

        } catch (err) {
            console.error("Error inesperado al guardar la configuración:", err);
            alert("Ocurrió un error inesperado al guardar los cambios.");
        }
    }

    return (
        <div style={{ 
            background: '#090d16', 
            padding: '1.75rem', 
            borderRadius: '1.25rem', 
            border: '1px solid rgba(255,255,255,0.08)', 
            width: '100%', 
            maxWidth: '620px', 
            maxHeight: '85vh', 
            display: 'flex', 
            flexDirection: 'column', 
            color: '#f3f4f6', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            fontFamily: 'sans-serif',
            boxSizing: 'border-box'
        }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    ⚙️ Configuración de Criterios y Ponderaciones
                </h2>
                {alCerrar && (
                    <button 
                        onClick={alCerrar} 
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        ✕
                    </button>
                )}
            </div>

            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1.2rem', lineHeight: '1.4', marginT: 0 }}>
                Define los rubros, porcentajes y la modalidad de evaluación escolar. La suma total de las ponderaciones debe ser exactamente el 100%.
            </p>

            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.75rem', 
                paddingRight: '0.35rem', 
                marginBottom: '1rem',
                minHeight: '200px'
            }}>
                {cargando ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        Cargando criterios de evaluación...
                    </div>
                ) : criteriosActuales.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        No hay criterios registrados. Haz clic en "+ Agregar Criterio" para comenzar.
                    </div>
                ) : (
                    criteriosActuales.map((criterio, index) => (
                        <div 
                            key={criterio.tempId || index} 
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '0.5rem', 
                                background: '#020617', 
                                padding: '0.85rem', 
                                borderRadius: '0.85rem', 
                                border: '1px solid rgba(255,255,255,0.08)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input 
                                    type="text" 
                                    value={criterio.nombre_criterio} 
                                    onChange={(e) => actualizarNombre(index, e.target.value)} 
                                    placeholder="Nombre del rubro (Ej. Trabajos en clase)" 
                                    style={{ 
                                        flex: 1, 
                                        padding: '0.55rem 0.75rem', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        borderRadius: '0.5rem', 
                                        fontSize: '0.82rem', 
                                        background: '#090d16', 
                                        color: '#f3f4f6', 
                                        fontWeight: '700', 
                                        outline: 'none' 
                                    }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <input 
                                        type="number" 
                                        value={criterio.porcentaje} 
                                        onChange={(e) => actualizarPorcentaje(index, e.target.value)} 
                                        min="0" 
                                        max="100" 
                                        step="1" 
                                        style={{ 
                                            width: '60px', 
                                            padding: '0.55rem 0.25rem', 
                                            border: '1px solid rgba(255,255,255,0.1)', 
                                            borderRadius: '0.5rem', 
                                            fontSize: '0.85rem', 
                                            textAlign: 'center', 
                                            background: '#090d16', 
                                            color: '#fbbf24', 
                                            fontWeight: '900', 
                                            outline: 'none' 
                                        }}
                                    />
                                    <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#94a3b8' }}>%</span>
                                </div>
                                <button 
                                    onClick={() => eliminarFila(index)} 
                                    style={{ 
                                        background: 'rgba(239, 68, 68, 0.1)', 
                                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                                        borderRadius: '0.5rem',
                                        color: '#fb7185', 
                                        cursor: 'pointer', 
                                        fontSize: '0.9rem', 
                                        padding: '0.4rem 0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }} 
                                    title="Eliminar rubro"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.45rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                    Modalidad de evaluación:
                                </span>
                                <select
                                    value={criterio.modo_evaluacion || 'cumplimiento'}
                                    onChange={(e) => actualizarModoEvaluacion(index, e.target.value)}
                                    style={{ 
                                        padding: '0.35rem 0.6rem', 
                                        border: '1px solid rgba(56, 189, 248, 0.3)', 
                                        borderRadius: '0.5rem', 
                                        background: '#090d16', 
                                        color: '#34d399', 
                                        fontSize: '0.75rem', 
                                        fontWeight: '800', 
                                        outline: 'none', 
                                        cursor: 'pointer' 
                                    }}
                                >
                                    <option value="cumplimiento">✔️ Por Cumplimiento (Entregas)</option>
                                    <option value="calificacion_numerica">🔢 Calificación Numérica Directa</option>
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>
                    Suma Total: <strong style={{ color: sumaTotal === 100 ? '#34d399' : '#fb7185', fontSize: '0.95rem' }}>{sumaTotal}%</strong>
                </span>
                {sumaTotal !== 100 ? (
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#fb7185', background: 'rgba(251, 113, 133, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', border: '1px solid rgba(251, 113, 133, 0.2)' }}>
                        ⚠️ Debe sumar exactamente 100%
                    </span>
                ) : (
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        ✅ Ponderación correcta
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button 
                    onClick={agregarFila} 
                    style={{ 
                        flex: 1, 
                        padding: '0.65rem', 
                        background: btnAgregadoAnimacion ? '#38bdf8' : 'rgba(255,255,255,0.06)', 
                        border: '1px solid',
                        borderColor: btnAgregadoAnimacion ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                        borderRadius: '0.6rem', 
                        color: btnAgregadoAnimacion ? '#020617' : '#f3f4f6', 
                        fontSize: '0.78rem', 
                        fontWeight: '900', 
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                        transform: btnAgregadoAnimacion ? 'scale(0.97)' : 'scale(1)'
                    }}
                >
                    {btnAgregadoAnimacion ? '✨ ¡Criterio Añadido!' : '+ Agregar Criterio'}
                </button>

                {alCerrar && (
                    <button 
                        onClick={alCerrar} 
                        style={{ 
                            padding: '0.65rem 0.9rem', 
                            background: 'transparent', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '0.6rem', 
                            color: '#94a3b8', 
                            fontSize: '0.78rem', 
                            fontWeight: '800', 
                            cursor: 'pointer' 
                        }}
                    >
                        Cancelar
                    </button>
                )}

                <button 
                    onClick={guardarCriterios} 
                    disabled={sumaTotal !== 100} 
                    style={{ 
                        flex: 1.2, 
                        padding: '0.65rem', 
                        background: sumaTotal === 100 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255,255,255,0.05)', 
                        border: 'none', 
                        borderRadius: '0.6rem', 
                        color: sumaTotal === 100 ? '#ffffff' : '#6b7280', 
                        fontSize: '0.78rem', 
                        fontWeight: '900', 
                        cursor: sumaTotal === 100 ? 'pointer' : 'not-allowed',
                        boxShadow: sumaTotal === 100 ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                    }}
                >
                    Guardar Cambios
                </button>
            </div>

        </div>
    );
}