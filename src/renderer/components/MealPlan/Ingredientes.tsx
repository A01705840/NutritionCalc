import { useState } from 'react'
import { porcion } from './Catalogo'
import type { Catalogo } from './Catalogo'
import { GRUPOS } from './tipos'
import type { Ingrediente, Opcion } from './tipos'
import { interpretarEquivalentes, nuevoId } from './plan'

// ---------- Fila de ingrediente ----------

function FilaIngrediente({
  ingrediente,
  catalogo,
  onCambiar,
  onEliminar
}: {
  ingrediente: Ingrediente
  catalogo: Catalogo
  onCambiar: (ing: Ingrediente) => void
  onEliminar: () => void
}): React.JSX.Element {
  // Borrador local para poder escribir "0." o "1," sin que se pierda
  const [borrador, setBorrador] = useState(ingrediente.equivalentes.toString())
  // Si el valor cambia desde fuera (ej. "Ajustar opciones a la fila"), refleja el nuevo valor
  if (
    interpretarEquivalentes(borrador) !== 'invalido' &&
    interpretarEquivalentes(borrador) !== ingrediente.equivalentes
  )
    setBorrador(ingrediente.equivalentes.toString())
  const error = interpretarEquivalentes(borrador) === 'invalido'
  const alimento = catalogo.get(ingrediente.alimentoId)

  const cambiarEquivalentes = (texto: string): void => {
    setBorrador(texto)
    const eq = interpretarEquivalentes(texto)
    if (eq !== 'invalido') onCambiar({ ...ingrediente, equivalentes: eq })
  }

  return (
    <div className="menu-ingrediente">
      <select
        className="menu-ingrediente__alimento"
        value={ingrediente.alimentoId}
        onChange={(e) => onCambiar({ ...ingrediente, alimentoId: e.target.value })}
      >
        <option value="" disabled>
          Elige un alimento…
        </option>
        {GRUPOS.map((g) => (
          <optgroup key={g.key} label={g.etiqueta}>
            {[...catalogo.values()]
              .filter((a) => a.grupo === g.key)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} — {porcion(a, 1)}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <input
        className={`menu-ingrediente__eq${error ? ' menu-ingrediente__eq--error' : ''}`}
        value={borrador}
        onChange={(e) => cambiarEquivalentes(e.target.value)}
        inputMode="decimal"
        title="Equivalentes (múltiplos de 0.25)"
      />
      <span className="menu-ingrediente__texto">
        {error
          ? 'Usa múltiplos de 0.25'
          : alimento
            ? porcion(alimento, ingrediente.equivalentes)
            : ''}
      </span>
      <button className="menu-boton menu-boton--icono" onClick={onEliminar} title="Quitar">
        ×
      </button>
    </div>
  )
}

// ---------- Ingredientes + nota de una opción (o de una comida del recetario) ----------

export default function CamposOpcion({
  opcion,
  catalogo,
  onCambiar
}: {
  opcion: Opcion
  catalogo: Catalogo
  onCambiar: (op: Opcion) => void
}): React.JSX.Element {
  const cambiarIngrediente = (ing: Ingrediente): void =>
    onCambiar({
      ...opcion,
      ingredientes: opcion.ingredientes.map((i) => (i.id === ing.id ? ing : i))
    })

  return (
    <div>
      {opcion.ingredientes.map((ing) => (
        <FilaIngrediente
          key={ing.id}
          ingrediente={ing}
          catalogo={catalogo}
          onCambiar={cambiarIngrediente}
          onEliminar={() =>
            onCambiar({
              ...opcion,
              ingredientes: opcion.ingredientes.filter((i) => i.id !== ing.id)
            })
          }
        />
      ))}
      <button
        className="menu-boton"
        onClick={() =>
          onCambiar({
            ...opcion,
            ingredientes: [
              ...opcion.ingredientes,
              { id: nuevoId(), alimentoId: '', equivalentes: 1 }
            ]
          })
        }
      >
        + Agregar alimento
      </button>
      <textarea
        className="menu-opcion__nota"
        value={opcion.nota ?? ''}
        onChange={(e) => onCambiar({ ...opcion, nota: e.target.value })}
        placeholder="Nota (ej. Salsa de jitomate libre, sin freír)"
        rows={2}
      />
    </div>
  )
}
