import { useState, useEffect, useRef } from 'react'
import type { Dispatch, FocusEvent, KeyboardEvent } from 'react'
import { GRUPOS, coloresGrupo } from './tipos'
import type { Celda, PlanAlimenticio } from './tipos'
import { asignado } from './plan'
import type { Accion } from './plan'
import './MealPlan.css'

// -------- Celda Editable ---------

function interpretarRacion(texto: string): number | null | 'invalido' {
  const limpio = texto.trim().replace(',', '.')
  if (limpio == '') return null
  const n = Number(limpio)
  if (Number.isNaN(n) || n < 0 || (n * 2) % 1 !== 0) return 'invalido'
  return n
}

function CeldaEditable({
  celda,
  onGuardar
}: {
  celda: Celda
  onGuardar: (c: Celda) => void
}): React.JSX.Element {
  const [editando, setEditando] = useState(false)
  const [borradorRacion, setBorradorRacion] = useState('')
  const [borradorNota, setBorradorNota] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editando) inputRef.current?.select()
  }, [editando])

  const iniciarEdicion = (): void => {
    setBorradorRacion(celda.racion?.toString() ?? '')
    setBorradorNota(celda.nota ?? '')
    setError(false)
    setEditando(true)
  }

  const guardar = (): void => {
    const racion = interpretarRacion(borradorRacion)
    if (racion === 'invalido') {
      setError(true)
      return
    }
    onGuardar({ racion, nota: borradorNota.trim() || undefined })
    setEditando(false)
  }

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') guardar()
    if (e.key === 'Escape') setEditando(false)
  }

  // Guarda cuando se pierde el foco, pero no cuando se pasa al input de nota
  const onBlur = (e: FocusEvent<HTMLTableCellElement>): void => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) guardar()
  }

  if (editando) {
    return (
      <td className="meal-table__cell" onBlur={onBlur}>
        <input
          ref={inputRef}
          value={borradorRacion}
          onChange={(e) => {
            setBorradorRacion(e.target.value)
            setError(false)
          }}
          onKeyDown={onKeyDown}
          inputMode="decimal"
          placeholder="0"
          className={`meal-table__input${error ? ' meal-table__input--error' : ''}`}
        />
        <input
          value={borradorNota}
          onChange={(e) => setBorradorNota(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nota"
          className="meal-table__input meal-table__input--note"
        />
        {error && <div className="meal-table__error">Usa múltiplos de 0.5</div>}
      </td>
    )
  }

  return (
    <td className="meal-table__cell">
      <button className="meal-table__cell-button" onClick={iniciarEdicion}>
        <span className="meal-table__value">{celda.racion ?? ''}</span>
        {celda.nota && <span className="meal-table__note">{celda.nota}</span>}
      </button>
    </td>
  )
}

// -------- Meta diaria editable ---------

function MetaEditable({
  meta,
  onGuardar
}: {
  meta: number
  onGuardar: (valor: number) => void
}): React.JSX.Element {
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editando) inputRef.current?.select()
  }, [editando])

  const iniciarEdicion = (): void => {
    setBorrador(meta ? meta.toString() : '')
    setError(false)
    setEditando(true)
  }

  const guardar = (): void => {
    const valor = interpretarRacion(borrador)
    if (valor === 'invalido') {
      setError(true)
      return
    }
    onGuardar(valor ?? 0) // vacío = 0
    setEditando(false)
  }

  if (editando) {
    return (
      <>
        <input
          ref={inputRef}
          value={borrador}
          onChange={(e) => {
            setBorrador(e.target.value)
            setError(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') guardar()
            if (e.key === 'Escape') setEditando(false)
          }}
          onBlur={guardar}
          inputMode="decimal"
          placeholder="0"
          className={`meal-table__input${error ? ' meal-table__input--error' : ''}`}
        />
        {error && <div className="meal-table__error">Usa múltiplos de 0.5</div>}
      </>
    )
  }

  return (
    <button
      className="meal-table__total meal-table__meta-button"
      onClick={iniciarEdicion}
      title="Editar raciones por día"
    >
      {meta || '–'}
    </button>
  )
}

// -------- Hora editable ---------

function HoraEditable({
  hora,
  onGuardar
}: {
  hora: string
  onGuardar: (hora: string) => void
}): React.JSX.Element {
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editando) inputRef.current?.select()
  }, [editando])

  // Texto libre ("7:30 am", "4:00 – 4:30 pm"); vacío = se queda la hora anterior
  const guardar = (): void => {
    if (borrador.trim()) onGuardar(borrador.trim())
    setEditando(false)
  }

  if (editando) {
    return (
      <input
        ref={inputRef}
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') guardar()
          if (e.key === 'Escape') setEditando(false)
        }}
        onBlur={guardar}
        placeholder="7:30 am"
        className="meal-table__input meal-table__input--hora"
      />
    )
  }

  return (
    <button
      className="meal-table__time meal-table__hora-button"
      onClick={() => {
        setBorrador(hora)
        setEditando(true)
      }}
      title="Editar hora"
    >
      {hora}
    </button>
  )
}

// ---------- Tabla ----------

export default function TablaPlanAlimenticio({
  plan,
  dispatch
}: {
  plan: PlanAlimenticio
  dispatch: Dispatch<Accion>
}): React.JSX.Element {
  return (
    <table className="meal-table">
      <thead>
        <tr>
          <th className="meal-table__label meal-table__header">Grupo de alimentos</th>
          {GRUPOS.map((g) => (
            <th key={g.key} className="meal-table__header" style={coloresGrupo(g)}>
              {g.etiqueta}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {/* Metas diarias + estado en vivo por columna */}
        <tr className="meal-table__totals-row">
          <th className="meal-table__label">Raciones / día</th>
          {GRUPOS.map((g) => {
            const meta = plan.metaDiaria[g.key]
            const diferencia = meta - asignado(plan, g.key)
            const estado =
              diferencia === 0
                ? { texto: '✓ completo', variante: 'ok' }
                : diferencia > 0
                  ? { texto: `faltan ${diferencia}`, variante: 'missing' }
                  : { texto: `sobran ${-diferencia}`, variante: 'over' }
            return (
              <td key={g.key} className="meal-table__cell" style={coloresGrupo(g)}>
                <MetaEditable
                  meta={meta}
                  onGuardar={(valor) => dispatch({ tipo: 'actualizarMeta', grupo: g.key, valor })}
                />
                {meta > 0 && (
                  <div className={`meal-table__status meal-table__status--${estado.variante}`}>
                    {estado.texto}
                  </div>
                )}
              </td>
            )
          })}
        </tr>

        {/* Una fila por comida, una celda por grupo */}
        {plan.comidas.map((comida) => (
          <tr key={comida.id}>
            <th className="meal-table__label">
              <div>{comida.nombre}</div>
              <HoraEditable
                hora={comida.hora}
                onGuardar={(hora) =>
                  dispatch({ tipo: 'actualizarHora', comidaId: comida.id, hora })
                }
              />
            </th>
            {GRUPOS.map((g) => (
              <CeldaEditable
                key={g.key}
                celda={comida.celdas[g.key]}
                onGuardar={(celda) =>
                  dispatch({ tipo: 'actualizarCelda', comidaId: comida.id, grupo: g.key, celda })
                }
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
