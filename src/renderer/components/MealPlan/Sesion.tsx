import { useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import type { PlanAlimenticio } from './tipos'
import { planInicial } from './plan'
import type { Accion } from './plan'
import { excelAPlan, planAExcel } from './excel'
import './Sesion.css'

// Muestra hasta 10 errores del Excel; el resto se resume
const listarErrores = (errores: string[]): string =>
  errores
    .slice(0, 10)
    .map((e) => `• ${e}`)
    .concat(errores.length > 10 ? [`…y ${errores.length - 10} más`] : [])
    .join('\n')

interface PlantillaLeida {
  plan: PlanAlimenticio
  propia: boolean // false = no hay plantilla guardada, o tiene errores: se usa la de fábrica
  error?: string
}

// Lee la plantilla guardada; sin plantilla (o con errores) regresa la de fábrica
async function leerPlantilla(): Promise<PlantillaLeida> {
  const archivo = await window.api.leerPlantilla()
  if (archivo.error)
    return {
      plan: planInicial,
      propia: false,
      error: `No se pudo leer la plantilla: ${archivo.error}`
    }
  if (!archivo.datos) return { plan: planInicial, propia: false }
  const resultado = await excelAPlan(archivo.datos)
  if ('errores' in resultado)
    return {
      plan: planInicial,
      propia: false,
      error: `La plantilla guardada tiene errores; se usó la de fábrica. Corrígela con "Ver plantilla en carpeta":\n${listarErrores(resultado.errores)}`
    }
  // La plantilla no trae opciones elegidas: cada sesión empieza con el menú vacío
  const comidas = resultado.plan.comidas.map((c) => ({ ...c, opciones: [] }))
  return { plan: { ...resultado.plan, comidas }, propia: true }
}

// Botones para guardar/abrir sesiones y guardar la plantilla con la que abren las sesiones nuevas
export default function BarraSesion({
  plan,
  dispatch
}: {
  plan: PlanAlimenticio
  dispatch: Dispatch<Accion>
}): React.JSX.Element {
  const [mensaje, setMensaje] = useState<{ texto: string; error?: boolean } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  // Último plan guardado o cargado. Cada cambio crea un plan nuevo, así que basta comparar
  // la referencia para saber si hay cambios sin guardar.
  const [guardado, setGuardado] = useState(plan)
  const sinGuardar = plan !== guardado

  const aviso = (texto: string): void => setMensaje({ texto })
  const falla = (texto: string): void => setMensaje({ texto, error: true })

  // Le avisa al proceso principal (para preguntar al cerrar la ventana) y lo marca en el título
  useEffect(() => {
    window.api.avisarCambios(sinGuardar)
    document.title = sinGuardar ? 'NutritionCalc • cambios sin guardar' : 'NutritionCalc'
  }, [sinGuardar])

  const cargar = (nuevo: PlanAlimenticio): void => {
    dispatch({ tipo: 'cargarPlan', plan: nuevo })
    setGuardado(nuevo)
  }

  // Antes de reemplazar lo que hay en pantalla; sin cambios pendientes no pregunta
  const descartarCambios = (): boolean =>
    !sinGuardar ||
    window.confirm('Tienes cambios sin guardar en esta sesión y se perderán. ¿Continuar?')

  const aplicarPlantilla = (p: PlantillaLeida, alIniciar: boolean): void => {
    cargar(p.plan)
    if (p.error) falla(p.error)
    else if (!alIniciar)
      aviso(
        p.propia
          ? 'Nueva sesión con tu plantilla.'
          : 'Nueva sesión con la plantilla de fábrica (aún no guardas una propia).'
      )
  }

  useEffect(() => {
    leerPlantilla().then((p) => aplicarPlantilla(p, true))
    // Solo al abrir la app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Evita dos operaciones a la vez y atrapa errores inesperados
  const ejecutar = (accion: () => Promise<void>) => async (): Promise<void> => {
    setOcupado(true)
    try {
      await accion()
    } catch (e) {
      console.error(e)
      falla(`Algo falló: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setOcupado(false)
    }
  }

  const nuevaSesion = ejecutar(async () => {
    if (!descartarCambios()) return
    aplicarPlantilla(await leerPlantilla(), false)
  })

  // true = se guardó; false = se canceló o falló
  const guardar = async (): Promise<boolean> => {
    const enPantalla = plan
    const resultado = await window.api.guardarSesion(await planAExcel(enPantalla, 'sesion'))
    if (resultado.ruta) {
      setGuardado(enPantalla)
      aviso(`Sesión guardada en ${resultado.ruta}`)
      return true
    }
    if (resultado.error) falla(`No se pudo guardar la sesión: ${resultado.error}`)
    return false
  }

  const guardarSesion = ejecutar(async () => {
    await guardar()
  })

  // Al cerrar la ventana con cambios, el proceso principal pregunta; si eligen "Guardar",
  // pide guardar aquí y solo cierra si de verdad se guardó
  const guardarRef = useRef(guardar)
  useEffect(() => {
    guardarRef.current = guardar
  })
  useEffect(
    () =>
      window.api.alPedirGuardarYSalir(async () => {
        if (await guardarRef.current()) window.api.cerrarVentana()
      }),
    []
  )

  const abrirSesion = ejecutar(async () => {
    if (!descartarCambios()) return
    const archivo = await window.api.abrirSesion()
    if (archivo.error) return falla(`No se pudo abrir: ${archivo.error}`)
    if (!archivo.datos) return
    const resultado = await excelAPlan(archivo.datos)
    if ('errores' in resultado)
      return falla(`No se pudo abrir ${archivo.ruta}:\n${listarErrores(resultado.errores)}`)
    cargar(resultado.plan)
    aviso(
      resultado.tipo === 'sesion'
        ? `Sesión abierta: ${archivo.ruta}`
        : `Se abrió una plantilla (sin opciones de menú): ${archivo.ruta}`
    )
  })

  const guardarPlantilla = ejecutar(async () => {
    if (
      !window.confirm(
        'Las sesiones nuevas abrirán con esta tabla (metas, horas y raciones), Mis comidas y las etiquetas. Las opciones elegidas del menú no se guardan en la plantilla. ¿Continuar?'
      )
    )
      return
    const resultado = await window.api.guardarPlantilla(await planAExcel(plan, 'plantilla'))
    if (resultado.ruta) aviso(`Plantilla guardada en ${resultado.ruta}`)
    else if (resultado.error) falla(`No se pudo guardar la plantilla: ${resultado.error}`)
  })

  return (
    <div className="sesion">
      <div className="sesion__barra">
        <div className="sesion__grupo">
          <span className="sesion__etiqueta">Sesión</span>
          <button
            className="menu-boton menu-boton--compacto"
            onClick={nuevaSesion}
            disabled={ocupado}
          >
            Nueva
          </button>
          <button
            className="menu-boton menu-boton--compacto"
            onClick={abrirSesion}
            disabled={ocupado}
          >
            Abrir…
          </button>
          <button
            className="menu-boton menu-boton--compacto menu-boton--primario"
            onClick={guardarSesion}
            disabled={ocupado}
          >
            Guardar sesión
          </button>
          {sinGuardar && <span className="sesion__pendiente">● Cambios sin guardar</span>}
        </div>
        <div className="sesion__grupo">
          <span className="sesion__etiqueta">Plantilla</span>
          <button
            className="menu-boton menu-boton--compacto"
            onClick={guardarPlantilla}
            disabled={ocupado}
            title="Guarda la tabla, Mis comidas y las etiquetas para las sesiones nuevas"
          >
            Guardar como plantilla
          </button>
          <button
            className="menu-boton menu-boton--compacto"
            onClick={() => window.api.mostrarPlantilla()}
            title="Abre la carpeta donde está el Excel de la plantilla"
          >
            Ver plantilla en carpeta
          </button>
        </div>
      </div>
      {mensaje && (
        <div className={`sesion__mensaje${mensaje.error ? ' sesion__mensaje--error' : ''}`}>
          {mensaje.texto}
          <button className="sesion__cerrar" onClick={() => setMensaje(null)} title="Cerrar">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
