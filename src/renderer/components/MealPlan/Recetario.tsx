import { useState } from 'react'
import type { Dispatch } from 'react'
import { fraccion } from './Catalogo'
import type { Catalogo } from './Catalogo'
import { GRUPOS, coloresGrupo } from './tipos'
import type { Comida, Etiqueta, Opcion } from './tipos'
import { etiquetaDeComida, lineasOpcion, nuevoId, opcionCuadra, revisarOpcion } from './plan'
import type { Accion } from './plan'
import CamposOpcion from './Ingredientes'
import { AdministradorEtiquetas, SelectorEtiquetas } from './Etiquetas'

const etiquetaGrupo = new Map(GRUPOS.map((g) => [g.key, g]))

// ---------- Tarjeta de una comida guardada ----------

function TarjetaReceta({
  receta,
  comida,
  catalogo,
  nombreEtiqueta,
  onUsar,
  onEditar,
  onEliminar
}: {
  receta: Opcion
  comida: Comida
  catalogo: Catalogo
  nombreEtiqueta: Map<string, string>
  onUsar: () => void
  onEditar: () => void
  onEliminar: () => void
}): React.JSX.Element {
  const cuadra = opcionCuadra(receta, comida, catalogo)

  return (
    <article className={`menu-receta${cuadra ? ' menu-receta--cuadra' : ''}`}>
      <div className="menu-receta__titulo">{receta.titulo}</div>
      {(receta.etiquetas ?? []).length > 0 && (
        <div className="menu-etiquetas">
          {receta.etiquetas!.map((id) => (
            <span key={id} className="menu-etiqueta menu-etiqueta--fija">
              {nombreEtiqueta.get(id) ?? '?'}
            </span>
          ))}
        </div>
      )}
      <div className="menu-receta__estado">
        {cuadra ? `✓ Cuadra con ${comida.nombre.toLowerCase()}` : 'No cuadra con la fila'}
      </div>

      <div className="menu-receta__lineas">
        {lineasOpcion(receta, catalogo).map((l, i) => (
          <div key={i}>- {l}</div>
        ))}
        {receta.nota && <div className="menu-vista__nota">{receta.nota}</div>}
      </div>

      {/* Equivalentes de la receta; en rojo los que no coinciden con la fila */}
      <div className="menu-receta__chips">
        {revisarOpcion(receta, comida, catalogo).map((r) => (
          <span
            key={r.grupo}
            className={`menu-chip${r.meta === r.asignado ? '' : ' menu-chip--fuera'}`}
            style={coloresGrupo(etiquetaGrupo.get(r.grupo)!)}
            title={`La fila pide ${fraccion(r.meta)}`}
          >
            {etiquetaGrupo.get(r.grupo)!.etiqueta} {fraccion(r.asignado)}
          </span>
        ))}
      </div>

      <footer className="menu-receta__acciones">
        <button className="menu-boton menu-boton--primario" onClick={onUsar}>
          Usar en {comida.nombre.toLowerCase()}
        </button>
        <button className="menu-boton" onClick={onEditar}>
          Editar
        </button>
        <button className="menu-boton menu-boton--peligro" onClick={onEliminar}>
          Eliminar
        </button>
      </footer>
    </article>
  )
}

// ---------- Panel "Mis comidas" ----------

export default function PanelRecetas({
  recetario,
  etiquetas,
  comida,
  catalogo,
  dispatch,
  onCerrar
}: {
  recetario: Opcion[]
  etiquetas: Etiqueta[]
  comida: Comida
  catalogo: Catalogo
  dispatch: Dispatch<Accion>
  onCerrar: () => void
}): React.JSX.Element {
  // Comida que se está capturando o editando (null = ninguna)
  const [borrador, setBorrador] = useState<Opcion | null>(null)
  const [error, setError] = useState('')
  // Empieza filtrando por el tiempo de comida abierto (null = todas)
  const [filtroElegido, setFiltro] = useState<string | null>(
    etiquetaDeComida(comida, etiquetas) ?? null
  )
  const [verEtiquetas, setVerEtiquetas] = useState(false)
  const nombreEtiqueta = new Map(etiquetas.map((e) => [e.id, e.nombre]))
  // Si se eliminó la etiqueta del filtro, se muestran todas
  const filtro = filtroElegido && nombreEtiqueta.has(filtroElegido) ? filtroElegido : null
  const visibles = recetario.filter(
    (r) => r.id !== borrador?.id && (!filtro || r.etiquetas?.includes(filtro))
  )

  const alternarEtiqueta = (e: string | null): void => {
    if (!borrador || !e) return
    const actuales = borrador.etiquetas ?? []
    setBorrador({
      ...borrador,
      etiquetas: actuales.includes(e) ? actuales.filter((x) => x !== e) : [...actuales, e]
    })
  }

  const editar = (receta: Opcion | null): void => {
    setBorrador(receta)
    setError('')
  }

  const guardar = (): void => {
    if (!borrador) return
    const ingredientes = borrador.ingredientes.filter((i) => i.alimentoId !== '')
    if (!borrador.titulo.trim()) return setError('Ponle nombre a la comida')
    if (ingredientes.length === 0) return setError('Agrega al menos un alimento')
    dispatch({
      tipo: 'guardarReceta',
      receta: { ...borrador, titulo: borrador.titulo.trim(), ingredientes }
    })
    editar(null)
  }

  return (
    <section className="menu-recetario">
      <header className="menu-recetario__encabezado">
        <div>
          <h3 className="menu-recetario__titulo">Mis comidas</h3>
          <div className="menu-recetario__ayuda">
            Elige una para agregarla como opción de {comida.nombre.toLowerCase()} ({comida.hora})
          </div>
        </div>
        <button
          className="menu-boton menu-boton--primario"
          disabled={borrador !== null}
          onClick={() =>
            editar({
              id: nuevoId(),
              titulo: '',
              etiquetas: filtro ? [filtro] : [],
              ingredientes: [{ id: nuevoId(), alimentoId: '', equivalentes: 1 }]
            })
          }
        >
          + Nueva comida
        </button>
        <button className="menu-boton" onClick={() => setVerEtiquetas((v) => !v)}>
          {verEtiquetas ? 'Ocultar etiquetas' : 'Editar etiquetas'}
        </button>
        <button className="menu-boton" onClick={onCerrar}>
          Cerrar
        </button>
      </header>

      {verEtiquetas && (
        <AdministradorEtiquetas etiquetas={etiquetas} recetario={recetario} dispatch={dispatch} />
      )}

      {borrador && (
        <article className="menu-opcion menu-recetario__editor">
          <header className="menu-opcion__encabezado">
            <input
              className="menu-opcion__titulo"
              value={borrador.titulo}
              onChange={(e) => setBorrador({ ...borrador, titulo: e.target.value })}
              placeholder="Nombre de la comida (ej. Huevo con nopales)"
              autoFocus
            />
          </header>
          <div className="menu-recetario__campo">
            <span className="menu-recetario__ayuda">Etiquetas:</span>
            <SelectorEtiquetas
              etiquetas={etiquetas}
              activas={borrador.etiquetas ?? []}
              onAlternar={alternarEtiqueta}
            />
          </div>
          <CamposOpcion opcion={borrador} catalogo={catalogo} onCambiar={setBorrador} />
          {error && <div className="meal-table__error">{error}</div>}
          <div className="menu-receta__acciones">
            <button className="menu-boton menu-boton--primario" onClick={guardar}>
              Guardar comida
            </button>
            <button className="menu-boton" onClick={() => editar(null)}>
              Cancelar
            </button>
          </div>
        </article>
      )}

      <div className="menu-recetario__campo">
        <span className="menu-recetario__ayuda">Mostrar:</span>
        <SelectorEtiquetas
          etiquetas={etiquetas}
          activas={filtro ? [filtro] : []}
          onAlternar={(e) => setFiltro(e === filtro ? null : e)}
          todas
        />
      </div>

      {visibles.length === 0 && !borrador && (
        <div className="menu-recetario__ayuda">
          {filtro
            ? `No tienes comidas con la etiqueta ${nombreEtiqueta.get(filtro)}.`
            : 'Aún no tienes comidas guardadas.'}
        </div>
      )}

      <div className="menu-recetario__lista">
        {visibles.map((r) => (
          <TarjetaReceta
            key={r.id}
            receta={r}
            comida={comida}
            catalogo={catalogo}
            nombreEtiqueta={nombreEtiqueta}
            onUsar={() => dispatch({ tipo: 'usarReceta', comidaId: comida.id, recetaId: r.id })}
            onEditar={() => editar(r)}
            onEliminar={() => {
              if (window.confirm(`¿Eliminar "${r.titulo}" de Mis comidas?`))
                dispatch({ tipo: 'eliminarReceta', recetaId: r.id })
            }}
          />
        ))}
      </div>
    </section>
  )
}
