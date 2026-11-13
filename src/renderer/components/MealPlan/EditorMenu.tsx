import { useState } from 'react'
import type { Dispatch } from 'react'
import { crearCatalogo, fraccion } from './Catalogo'
import type { Catalogo } from './Catalogo'
import { GRUPOS, coloresGrupo } from './tipos'
import type { Comida, Opcion, PlanAlimenticio } from './tipos'
import {
  ajustarOpcion,
  copiarOpcion,
  etiquetaDeComida,
  lineasOpcion,
  opcionCuadra,
  revisarOpcion
} from './plan'
import type { Accion } from './plan'
import CamposOpcion from './Ingredientes'
import PanelRecetas from './Recetario'
import PanelAlimentos from './FormAlimento'
import { datosDocx } from './exportar'
import './EditorMenu.css'

const etiquetaGrupo = new Map(GRUPOS.map((g) => [g.key, g]))

// ---------- Tarjeta de opción ----------

function TarjetaOpcion({
  opcion,
  numero,
  fila,
  catalogo,
  onCambiar,
  onEliminar,
  onGuardarReceta
}: {
  opcion: Opcion
  numero: number
  fila: Comida
  catalogo: Catalogo
  onCambiar: (op: Opcion) => void
  onEliminar: () => void
  onGuardarReceta: () => void
}): React.JSX.Element {
  const revision = revisarOpcion(opcion, fila, catalogo)
  const cuadra = opcionCuadra(opcion, fila, catalogo)
  const lineas = lineasOpcion(opcion, catalogo)

  return (
    <article className={`menu-opcion${cuadra ? '' : ' menu-opcion--pendiente'}`}>
      <header className="menu-opcion__encabezado">
        <span className="menu-opcion__numero">{numero}.</span>
        <input
          className="menu-opcion__titulo"
          value={opcion.titulo}
          onChange={(e) => onCambiar({ ...opcion, titulo: e.target.value })}
          placeholder={`Opción ${numero} (ej. Huevo con nopales)`}
        />
        <button
          className="menu-boton menu-boton--compacto"
          onClick={onGuardarReceta}
          disabled={opcion.titulo.trim() === '' || opcion.ingredientes.length === 0}
          title="Guardar esta opción para reutilizarla en otras comidas"
        >
          Guardar en Mis comidas
        </button>
        <button className="menu-boton menu-boton--peligro" onClick={onEliminar}>
          Eliminar opción
        </button>
      </header>

      <div className="menu-opcion__cuerpo">
        <CamposOpcion opcion={opcion} catalogo={catalogo} onCambiar={onCambiar} />

        {/* Validación contra la fila de la tabla */}
        <div className="menu-opcion__lateral">
          <div className="menu-validacion">
            {revision.map((r) => {
              const g = etiquetaGrupo.get(r.grupo)!
              const diferencia = r.meta - r.asignado
              const variante = diferencia === 0 ? 'ok' : diferencia > 0 ? 'missing' : 'over'
              return (
                <div key={r.grupo} className="menu-validacion__fila" style={coloresGrupo(g)}>
                  <span className="menu-validacion__grupo">{g.etiqueta}</span>
                  <span>
                    {r.asignado} / {r.meta}
                  </span>
                  <span className={`meal-table__status--${variante}`}>
                    {diferencia === 0
                      ? '✓'
                      : diferencia > 0
                        ? `faltan ${diferencia}`
                        : `sobran ${-diferencia}`}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Texto calculado, tal como sale en el Word */}
          <div className="menu-vista">
            <div className="menu-vista__titulo">
              {numero}. {opcion.titulo || `Opción ${numero}`}
            </div>
            {lineas.map((l, i) => (
              <div key={i}>- {l}</div>
            ))}
            {opcion.nota && <div className="menu-vista__nota">{opcion.nota}</div>}
          </div>
        </div>
      </div>
    </article>
  )
}

// ---------- Editor ----------

export default function EditorMenu({
  plan,
  dispatch
}: {
  plan: PlanAlimenticio
  dispatch: Dispatch<Accion>
}): React.JSX.Element {
  const [comidaId, setComidaId] = useState(plan.comidas[0].id)
  const [mensaje, setMensaje] = useState('')
  const [verRecetario, setVerRecetario] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [verAlimentos, setVerAlimentos] = useState(false)
  const catalogo = crearCatalogo(plan.alimentos)
  const comida = plan.comidas.find((c) => c.id === comidaId) ?? plan.comidas[0]
  const sinCuadrar = comida.opciones.filter((op) => !opcionCuadra(op, comida, catalogo))

  const ajustarOpciones = (): void => {
    if (
      !window.confirm(
        `Se cambiarán las cantidades de ${sinCuadrar.length} opción(es) de ${comida.nombre.toLowerCase()} para que cuadren con la fila. ¿Continuar?`
      )
    )
      return
    dispatch({ tipo: 'ajustarOpciones', comidaId: comida.id })
    // Grupos que la opción no tiene no se pueden completar solos
    const siguen = sinCuadrar.filter(
      (op) => !opcionCuadra(ajustarOpcion(op, comida, catalogo), comida, catalogo)
    )
    setMensaje(
      siguen.length === 0
        ? `Se ajustaron ${sinCuadrar.length} opción(es).`
        : `Se ajustaron las opciones. ${siguen.length} siguen sin cuadrar porque les falta algún grupo o no se llega exacto con las piezas: ${siguen.map((op) => op.titulo || 'sin título').join(', ')}.`
    )
  }

  const exportar = async (formato: FormatoMenu): Promise<void> => {
    const pendientes = plan.comidas.flatMap((c) =>
      c.opciones
        .filter((op) => !opcionCuadra(op, c, catalogo))
        .map((op) => `• ${c.nombre} ${c.hora}: ${op.titulo || 'sin título'}`)
    )
    if (
      pendientes.length > 0 &&
      !window.confirm(
        `Estas opciones no cuadran con su fila:\n${pendientes.join('\n')}\n\n¿Exportar de todos modos?`
      )
    )
      return
    // Convertir a PDF tarda unos segundos porque abre Word en segundo plano
    setExportando(true)
    if (formato === 'pdf') setMensaje('Generando PDF…')
    try {
      const resultado = await window.api.exportarMenu(datosDocx(plan), formato)
      if (resultado.ruta) setMensaje(`Menú guardado en ${resultado.ruta}`)
      else if (resultado.error) setMensaje(`No se pudo exportar: ${resultado.error}`)
      else setMensaje('')
    } finally {
      setExportando(false)
    }
  }

  return (
    <section className="menu-editor">
      <div className="menu-editor__barra">
        <nav className="menu-tabs">
          {plan.comidas.map((c) => {
            const todasCuadran = c.opciones.every((op) => opcionCuadra(op, c, catalogo))
            return (
              <button
                key={c.id}
                className={`menu-tabs__tab${c.id === comida.id ? ' menu-tabs__tab--activa' : ''}`}
                onClick={() => setComidaId(c.id)}
              >
                <span>{c.nombre}</span>
                <span className="menu-tabs__hora">{c.hora}</span>
                <span
                  className={`menu-tabs__conteo${todasCuadran ? '' : ' menu-tabs__conteo--pendiente'}`}
                >
                  {c.opciones.length}
                </span>
              </button>
            )
          })}
        </nav>
        <div className="menu-editor__exportar">
          <button
            className="menu-boton menu-boton--primario"
            onClick={() => exportar('docx')}
            disabled={exportando}
          >
            Exportar a Word
          </button>
          <button
            className="menu-boton menu-boton--primario"
            onClick={() => exportar('pdf')}
            disabled={exportando}
          >
            Exportar a PDF
          </button>
        </div>
      </div>
      {mensaje && <div className="menu-editor__mensaje">{mensaje}</div>}

      <div className="menu-editor__meta">
        Equivalentes de la fila:
        {GRUPOS.filter((g) => comida.celdas[g.key].racion).map((g) => (
          <span key={g.key} className="menu-chip" style={coloresGrupo(g)}>
            {g.etiqueta} {fraccion(comida.celdas[g.key].racion!)}
          </span>
        ))}
        <button
          className="menu-boton menu-boton--compacto menu-editor__ajustar"
          onClick={ajustarOpciones}
          disabled={sinCuadrar.length === 0}
          title="Cambia las cantidades de las opciones para que sumen lo que pide la fila"
        >
          Ajustar opciones a la fila
        </button>
      </div>

      {comida.opciones.map((op, i) => (
        <TarjetaOpcion
          key={op.id}
          opcion={op}
          numero={i + 1}
          fila={comida}
          catalogo={catalogo}
          onCambiar={(opcion) =>
            dispatch({ tipo: 'actualizarOpcion', comidaId: comida.id, opcion })
          }
          onEliminar={() =>
            dispatch({ tipo: 'eliminarOpcion', comidaId: comida.id, opcionId: op.id })
          }
          onGuardarReceta={() => {
            const etiqueta = etiquetaDeComida(comida, plan.etiquetas)
            dispatch({
              tipo: 'guardarReceta',
              receta: { ...copiarOpcion(op), etiquetas: etiqueta ? [etiqueta] : [] }
            })
            setMensaje(`"${op.titulo.trim()}" se guardó en Mis comidas`)
          }}
        />
      ))}

      <div className="menu-editor__acciones">
        <button
          className="menu-boton"
          onClick={() => dispatch({ tipo: 'agregarOpcion', comidaId: comida.id })}
        >
          + Agregar opción a {comida.nombre.toLowerCase()}
        </button>
        <button className="menu-boton" onClick={() => setVerRecetario((v) => !v)}>
          {verRecetario
            ? 'Ocultar Mis comidas'
            : `Elegir de Mis comidas (${plan.recetario.length})`}
        </button>
        <button className="menu-boton" onClick={() => setVerAlimentos((v) => !v)}>
          {verAlimentos ? 'Ocultar Mis alimentos' : `Mis alimentos (${plan.alimentos.length})`}
        </button>
      </div>

      {verRecetario && (
        <PanelRecetas
          key={comida.id}
          recetario={plan.recetario}
          etiquetas={plan.etiquetas}
          comida={comida}
          catalogo={catalogo}
          dispatch={dispatch}
          onCerrar={() => setVerRecetario(false)}
        />
      )}

      {verAlimentos && (
        <PanelAlimentos
          plan={plan}
          catalogo={catalogo}
          dispatch={dispatch}
          onCerrar={() => setVerAlimentos(false)}
        />
      )}
    </section>
  )
}
