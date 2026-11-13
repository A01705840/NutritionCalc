import { useState } from 'react'
import type { Dispatch, KeyboardEvent } from 'react'
import type { Etiqueta, Opcion } from './tipos'
import { normalizar, nuevoId } from './plan'
import type { Accion } from './plan'

// ---------- Botones de etiqueta (para elegir o filtrar) ----------

export function SelectorEtiquetas({
  etiquetas,
  activas,
  onAlternar,
  todas
}: {
  etiquetas: Etiqueta[]
  activas: string[]
  onAlternar: (id: string | null) => void
  todas?: boolean // muestra el botón "Todas" (null)
}): React.JSX.Element {
  return (
    <div className="menu-etiquetas">
      {todas && (
        <button
          className={`menu-etiqueta${activas.length === 0 ? ' menu-etiqueta--activa' : ''}`}
          onClick={() => onAlternar(null)}
        >
          Todas
        </button>
      )}
      {etiquetas.map((e) => (
        <button
          key={e.id}
          className={`menu-etiqueta${activas.includes(e.id) ? ' menu-etiqueta--activa' : ''}`}
          onClick={() => onAlternar(e.id)}
        >
          {e.nombre}
        </button>
      ))}
    </div>
  )
}

// Regresa el error, o '' si el nombre se puede usar
function validarNombre(nombre: string, etiquetas: Etiqueta[], id?: string): string {
  if (!nombre.trim()) return 'Escribe un nombre'
  const repetida = etiquetas.some((e) => e.id !== id && normalizar(e.nombre) === normalizar(nombre))
  return repetida ? 'Ya existe una etiqueta con ese nombre' : ''
}

// ---------- Una etiqueta: renombrar o eliminar ----------

function FilaEtiqueta({
  etiqueta,
  etiquetas,
  usos,
  dispatch
}: {
  etiqueta: Etiqueta
  etiquetas: Etiqueta[]
  usos: number
  dispatch: Dispatch<Accion>
}): React.JSX.Element {
  const [borrador, setBorrador] = useState(etiqueta.nombre)
  const error = validarNombre(borrador, etiquetas, etiqueta.id)

  // Guarda al salir del campo; si el nombre no sirve, regresa al anterior
  const guardar = (): void => {
    if (error) return setBorrador(etiqueta.nombre)
    if (borrador.trim() !== etiqueta.nombre)
      dispatch({ tipo: 'guardarEtiqueta', etiqueta: { ...etiqueta, nombre: borrador.trim() } })
  }

  const eliminar = (): void => {
    const aviso = usos > 0 ? ` Se quitará de ${usos} comida(s) de Mis comidas.` : ''
    if (window.confirm(`¿Eliminar la etiqueta "${etiqueta.nombre}"?${aviso}`))
      dispatch({ tipo: 'eliminarEtiqueta', etiquetaId: etiqueta.id })
  }

  return (
    <div className="menu-etiquetas-admin__fila">
      <input
        className={`menu-etiquetas-admin__input${error ? ' menu-ingrediente__eq--error' : ''}`}
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={guardar}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') setBorrador(etiqueta.nombre)
        }}
        title={error || 'Edita el nombre y presiona Enter'}
      />
      <span className="menu-recetario__ayuda">{usos === 1 ? '1 comida' : `${usos} comidas`}</span>
      <button className="menu-boton menu-boton--icono" onClick={eliminar} title="Eliminar">
        ×
      </button>
    </div>
  )
}

// ---------- Administrar etiquetas ----------

export function AdministradorEtiquetas({
  etiquetas,
  recetario,
  dispatch
}: {
  etiquetas: Etiqueta[]
  recetario: Opcion[]
  dispatch: Dispatch<Accion>
}): React.JSX.Element {
  const [nueva, setNueva] = useState('')
  const [error, setError] = useState('')

  const agregar = (): void => {
    const problema = validarNombre(nueva, etiquetas)
    if (problema) return setError(problema)
    dispatch({ tipo: 'guardarEtiqueta', etiqueta: { id: nuevoId(), nombre: nueva.trim() } })
    setNueva('')
    setError('')
  }

  return (
    <div className="menu-etiquetas-admin">
      <div className="menu-recetario__ayuda">
        Las etiquetas con el mismo nombre que un tiempo de comida (Desayuno, Colación…) se usan para
        filtrar al abrir Mis comidas desde ese tiempo.
      </div>
      <div className="menu-etiquetas-admin__lista">
        {etiquetas.map((e) => (
          <FilaEtiqueta
            // Al renombrar se reinicia el borrador con el nombre guardado
            key={`${e.id}:${e.nombre}`}
            etiqueta={e}
            etiquetas={etiquetas}
            usos={recetario.filter((r) => r.etiquetas?.includes(e.id)).length}
            dispatch={dispatch}
          />
        ))}
      </div>
      <div className="menu-etiquetas-admin__fila">
        <input
          className="menu-etiquetas-admin__input"
          value={nueva}
          onChange={(e) => {
            setNueva(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && agregar()}
          placeholder="Nueva etiqueta (ej. Sin gluten)"
        />
        <button className="menu-boton menu-boton--compacto" onClick={agregar}>
          + Agregar
        </button>
      </div>
      {error && <div className="meal-table__error">{error}</div>}
    </div>
  )
}
