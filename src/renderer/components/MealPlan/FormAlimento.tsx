import { useState, type Dispatch } from 'react'
import { alimentoEnUso, crearAlimento, normalizar } from './plan'
import type { Accion } from './plan'
import { GRUPOS } from './tipos'
import type {
  Alimento,
  GrupoAlimenticio,
  PlanAlimenticio,
  SubGrupoAlimenticio,
  Unidad
} from './tipos'
import { UNIDADES, porcion, subgruposDe } from './Catalogo'
import type { Catalogo } from './Catalogo'

type Borrador = Omit<Alimento, 'id'>

const NUEVO: Borrador = { nombre: '', grupo: 'verduras', cantidad: 1, unidad: 'pza', gramos: 0 }

const etiquetaGrupo = new Map(GRUPOS.map((g) => [g.key, g.etiqueta]))

// ---------- Panel "Mis alimentos": crear y eliminar alimentos propios ----------

export default function PanelAlimentos({
  plan,
  catalogo,
  dispatch,
  onCerrar
}: {
  plan: PlanAlimenticio
  catalogo: Catalogo
  dispatch: Dispatch<Accion>
  onCerrar: () => void
}): React.JSX.Element {
  // Alimento que se está capturando (null = ninguno)
  const [borrador, setBorrador] = useState<Borrador | null>(null)
  const [error, setError] = useState('')
  const subgrupos = borrador ? subgruposDe(borrador.grupo) : []

  const editar = (alimento: Borrador | null): void => {
    setBorrador(alimento)
    setError('')
  }

  const guardar = (): void => {
    if (!borrador) return
    const nombre = borrador.nombre.trim()
    if (!nombre) return setError('Ponle nombre al alimento')
    // Al abrir un Excel los ingredientes se buscan por nombre, así que no se pueden repetir
    if ([...catalogo.values()].some((a) => normalizar(a.nombre) === normalizar(nombre)))
      return setError(`Ya existe un alimento llamado "${nombre}"`)
    if (!(borrador.cantidad > 0)) return setError('La cantidad debe ser mayor a 0')
    if (borrador.unidad !== 'g' && !(borrador.gramos > 0))
      return setError('Los gramos deben ser mayores a 0')
    dispatch({
      tipo: 'agregarAlimento',
      // En gramos la cantidad ya son los gramos
      alimento: crearAlimento({
        ...borrador,
        nombre,
        gramos: borrador.unidad === 'g' ? borrador.cantidad : borrador.gramos
      })
    })
    editar(null)
  }

  const eliminar = (a: Alimento): void => {
    if (window.confirm(`¿Eliminar "${a.nombre}" de Mis alimentos?`))
      dispatch({ tipo: 'eliminarAlimento', alimentoId: a.id })
  }

  return (
    <section className="menu-recetario">
      <header className="menu-recetario__encabezado">
        <div>
          <h3 className="menu-recetario__titulo">Mis alimentos</h3>
          <div className="menu-recetario__ayuda">
            Alimentos que no están en el catálogo. Cada uno se captura por 1 equivalente.
          </div>
        </div>
        <button
          className="menu-boton menu-boton--primario"
          disabled={borrador !== null}
          onClick={() => editar(NUEVO)}
        >
          + Nuevo alimento
        </button>
        <button className="menu-boton" onClick={onCerrar}>
          Cerrar
        </button>
      </header>

      {borrador && (
        <article className="menu-opcion menu-recetario__editor">
          <header className="menu-opcion__encabezado">
            <input
              className="menu-opcion__titulo"
              value={borrador.nombre}
              onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
              placeholder="Nombre del alimento (ej. queso cottage)"
              autoFocus
            />
          </header>
          <div className="menu-alimento__campos">
            <label>
              Grupo
              <select
                value={borrador.grupo}
                // El subgrupo depende del grupo, así que se borra al cambiarlo
                onChange={(e) =>
                  setBorrador({
                    ...borrador,
                    grupo: e.target.value as GrupoAlimenticio,
                    subgrupo: undefined
                  })
                }
              >
                {GRUPOS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.etiqueta}
                  </option>
                ))}
              </select>
            </label>
            {subgrupos.length > 0 && (
              <label>
                Subgrupo
                <select
                  value={borrador.subgrupo ?? ''}
                  onChange={(e) =>
                    setBorrador({
                      ...borrador,
                      subgrupo: (e.target.value || undefined) as SubGrupoAlimenticio | undefined
                    })
                  }
                >
                  <option value="">Sin subgrupo</option>
                  {subgrupos.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Cantidad
              <input
                type="number"
                min={0}
                step="any"
                value={borrador.cantidad}
                onChange={(e) => setBorrador({ ...borrador, cantidad: Number(e.target.value) })}
              />
            </label>
            <label>
              Unidad
              <select
                value={borrador.unidad}
                onChange={(e) => setBorrador({ ...borrador, unidad: e.target.value as Unidad })}
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            {borrador.unidad !== 'g' && (
              <label>
                Gramos
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={borrador.gramos}
                  onChange={(e) => setBorrador({ ...borrador, gramos: Number(e.target.value) })}
                />
              </label>
            )}
          </div>
          {borrador.nombre.trim() && borrador.cantidad > 0 && (
            <div className="menu-recetario__ayuda">
              1 equivalente = {porcion({ ...borrador, id: '' }, 1)}
            </div>
          )}
          {error && <div className="meal-table__error">{error}</div>}
          <div className="menu-receta__acciones">
            <button className="menu-boton menu-boton--primario" onClick={guardar}>
              Guardar alimento
            </button>
            <button className="menu-boton" onClick={() => editar(null)}>
              Cancelar
            </button>
          </div>
        </article>
      )}

      {plan.alimentos.length === 0 && !borrador && (
        <div className="menu-recetario__ayuda">Aún no has agregado alimentos.</div>
      )}

      <div className="menu-alimento__lista">
        {plan.alimentos.map((a) => {
          const enUso = alimentoEnUso(plan, a.id)
          return (
            <div key={a.id} className="menu-alimento">
              <span className="menu-alimento__nombre">{a.nombre}</span>
              <span className="menu-recetario__ayuda">
                {etiquetaGrupo.get(a.grupo)} · 1 eq = {porcion(a, 1)}
              </span>
              <button
                className="menu-boton menu-boton--peligro"
                onClick={() => eliminar(a)}
                disabled={enUso}
                title={
                  enUso
                    ? 'Se usa en alguna opción o en Mis comidas; quítalo de ahí para poder eliminarlo'
                    : undefined
                }
              >
                Eliminar
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
