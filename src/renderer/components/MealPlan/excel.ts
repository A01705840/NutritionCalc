import ExcelJS from 'exceljs'
import { ALIMENTOS, SUBGRUPOS, UNIDADES, crearCatalogo, porcion } from './Catalogo'
import type { Catalogo } from './Catalogo'
import { GRUPOS } from './tipos'
import type {
  Celda,
  Comida,
  Etiqueta,
  Alimento,
  GrupoAlimenticio,
  Ingrediente,
  Opcion,
  PlanAlimenticio
} from './tipos'
import { interpretarEquivalentes, normalizar, nuevoId } from './plan'

// sesion = todo, incluidas las opciones elegidas de cada comida
// plantilla = tabla, Mis comidas y etiquetas; las sesiones nuevas abren con esto
export type TipoArchivo = 'sesion' | 'plantilla'

const VERSION = 1

const HOJAS = {
  info: 'Info',
  metas: 'Metas',
  comidas: 'Comidas',
  opciones: 'Opciones',
  recetario: 'Mis comidas',
  etiquetas: 'Etiquetas',
  alimentos: 'Mis alimentos'
}

// Encabezados de columna; al leer se buscan por nombre, así que se pueden reordenar
const COL = {
  clave: 'Clave',
  comida: 'Comida',
  hora: 'Hora',
  grupo: 'Grupo',
  meta: 'Raciones por día',
  numero: 'Opción',
  numeroReceta: 'Receta',
  titulo: 'Título',
  etiquetas: 'Etiquetas',
  alimento: 'Alimento',
  equivalentes: 'Equivalentes',
  porcion: 'Porción (se calcula sola)',
  nota: 'Nota',
  nombre: 'Nombre',
  subgrupo: 'Subgrupo',
  cantidad: 'Cantidad',
  unidad: 'Unidad',
  gramos: 'Gramos'
}

const notaDe = (etiquetaGrupo: string): string => `${etiquetaGrupo} (nota)`

const grupoPorNombre = new Map(
  GRUPOS.flatMap((g) => [
    [normalizar(g.etiqueta), g.key],
    [normalizar(g.key), g.key]
  ])
)
const alimentosPorNombre = (alimentos: Alimento[]): Map<string, string> =>
  new Map(
    alimentos.flatMap((a): [string, string][] => [
      [normalizar(a.nombre), a.id],
      [normalizar(a.id), a.id]
    ])
  )

// ======================= Escribir =======================

function nuevaHoja(
  libro: ExcelJS.Workbook,
  nombre: string,
  columnas: [string, number][]
): ExcelJS.Worksheet {
  const hoja = libro.addWorksheet(nombre, { views: [{ state: 'frozen', ySplit: 1 }] })
  hoja.columns = columnas.map(([header, width]) => ({ header, width }))
  const encabezado = hoja.getRow(1)
  encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  encabezado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E7A44' } }
  return hoja
}

// La columna calculada va en gris para que se note que no hace falta llenarla
function marcarCalculada(hoja: ExcelJS.Worksheet, encabezado: string): void {
  const indice = (hoja.getRow(1).values as unknown[]).indexOf(encabezado)
  hoja.getColumn(indice).font = { italic: true, color: { argb: 'FF667085' } }
  hoja.getRow(1).getCell(indice).font = { bold: true, color: { argb: 'FFFFFFFF' } }
}

// Una fila por ingrediente; título y nota solo en la primera fila de la opción
function filasDeOpcion(op: Opcion, prefijo: unknown[], catalogo: Catalogo): unknown[][] {
  const ingredientes = op.ingredientes.filter((i) => catalogo.has(i.alimentoId))
  if (ingredientes.length === 0) return [[...prefijo, op.titulo, '', '', '', op.nota ?? '']]
  return ingredientes.map((ing, i) => {
    const alimento = catalogo.get(ing.alimentoId)!
    return [
      ...prefijo,
      i === 0 ? op.titulo : '',
      alimento.nombre,
      ing.equivalentes,
      porcion(alimento, ing.equivalentes),
      i === 0 ? (op.nota ?? '') : ''
    ]
  })
}

export async function planAExcel(plan: PlanAlimenticio, tipo: TipoArchivo): Promise<Uint8Array> {
  const libro = new ExcelJS.Workbook()
  libro.creator = 'NutritionCalc'
  const catalogo = crearCatalogo(plan.alimentos)

  const info = nuevaHoja(libro, HOJAS.info, [
    ['Dato', 16],
    ['Valor', 40]
  ])
  info.addRows([
    ['Tipo', tipo === 'sesion' ? 'Sesión' : 'Plantilla'],
    ['Versión', VERSION],
    ['Guardado', new Date().toLocaleString('es-MX')]
  ])

  const metas = nuevaHoja(libro, HOJAS.metas, [
    [COL.grupo, 28],
    [COL.meta, 18]
  ])
  GRUPOS.forEach((g) => metas.addRow([g.etiqueta, plan.metaDiaria[g.key]]))

  const comidas = nuevaHoja(libro, HOJAS.comidas, [
    [COL.clave, 14],
    [COL.comida, 14],
    [COL.hora, 16],
    ...GRUPOS.flatMap((g): [string, number][] => [
      [g.etiqueta, 12],
      [notaDe(g.etiqueta), 22]
    ])
  ])
  plan.comidas.forEach((c) =>
    comidas.addRow([
      c.id,
      c.nombre,
      c.hora,
      ...GRUPOS.flatMap((g) => [c.celdas[g.key].racion ?? '', c.celdas[g.key].nota ?? ''])
    ])
  )

  if (tipo === 'sesion') {
    const opciones = nuevaHoja(libro, HOJAS.opciones, [
      [COL.comida, 14],
      [COL.numero, 8],
      [COL.titulo, 36],
      [COL.alimento, 30],
      [COL.equivalentes, 13],
      [COL.porcion, 36],
      [COL.nota, 60]
    ])
    plan.comidas.forEach((c) =>
      c.opciones.forEach((op, i) => opciones.addRows(filasDeOpcion(op, [c.id, i + 1], catalogo)))
    )
    marcarCalculada(opciones, COL.porcion)
  }

  const nombreEtiqueta = new Map(plan.etiquetas.map((e) => [e.id, e.nombre]))
  const recetario = nuevaHoja(libro, HOJAS.recetario, [
    [COL.numeroReceta, 8],
    [COL.etiquetas, 24],
    [COL.titulo, 36],
    [COL.alimento, 30],
    [COL.equivalentes, 13],
    [COL.porcion, 36],
    [COL.nota, 60]
  ])
  plan.recetario.forEach((r, i) => {
    const etiquetas = (r.etiquetas ?? []).flatMap((id) => nombreEtiqueta.get(id) ?? []).join(', ')
    recetario.addRows(filasDeOpcion(r, [i + 1, etiquetas], catalogo))
  })
  marcarCalculada(recetario, COL.porcion)

  const etiquetas = nuevaHoja(libro, HOJAS.etiquetas, [
    [COL.clave, 38],
    [COL.nombre, 28]
  ])
  plan.etiquetas.forEach((e) => etiquetas.addRow([e.id, e.nombre]))

  // Los alimentos fijos no se guardan; solo los que se agregaron en este plan
  const etiquetaGrupo = new Map(GRUPOS.map((g) => [g.key, g.etiqueta]))
  const alimentos = nuevaHoja(libro, HOJAS.alimentos, [
    [COL.clave, 38],
    [COL.nombre, 30],
    [COL.grupo, 24],
    [COL.subgrupo, 24],
    [COL.cantidad, 10],
    [COL.unidad, 10],
    [COL.gramos, 10]
  ])
  plan.alimentos.forEach((a) =>
    alimentos.addRow([
      a.id,
      a.nombre,
      etiquetaGrupo.get(a.grupo),
      a.subgrupo ?? '',
      a.cantidad,
      a.unidad,
      a.gramos
    ])
  )

  return new Uint8Array(await libro.xlsx.writeBuffer())
}

// ======================= Leer =======================

type Fila = { numero: number; valor: (columna: string) => unknown }

// Texto de una celda, sin importar si es número, fórmula o texto con formato
function texto(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    if ('richText' in v)
      return (v as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('')
    if ('result' in v) return texto((v as ExcelJS.CellFormulaValue).result)
    if ('text' in v) return String((v as { text: unknown }).text)
  }
  return String(v).trim()
}

// Filas con datos de una hoja; cada valor se busca por el nombre de su columna
function leerFilas(hoja: ExcelJS.Worksheet): Fila[] {
  const columnas = new Map<string, number>()
  hoja.getRow(1).eachCell((celda, i) => columnas.set(normalizar(texto(celda.value)), i))
  const filas: Fila[] = []
  hoja.eachRow((fila, numero) => {
    if (numero === 1) return
    const valor = (columna: string): unknown => {
      const i = columnas.get(normalizar(columna))
      return i ? fila.getCell(i).value : null
    }
    filas.push({ numero, valor })
  })
  return filas
}

export type ResultadoLectura = { plan: PlanAlimenticio; tipo: TipoArchivo } | { errores: string[] }

export async function excelAPlan(datos: Uint8Array): Promise<ResultadoLectura> {
  const libro = new ExcelJS.Workbook()
  try {
    await libro.xlsx.load(
      datos.buffer.slice(datos.byteOffset, datos.byteOffset + datos.byteLength) as ArrayBuffer
    )
  } catch {
    return { errores: ['El archivo no es un Excel válido (.xlsx).'] }
  }

  const errores: string[] = []
  const error = (hoja: string, fila: number, mensaje: string): void => {
    errores.push(`Hoja "${hoja}", fila ${fila}: ${mensaje}`)
  }
  const hoja = (nombre: string): ExcelJS.Worksheet | undefined => {
    const encontrada = libro.worksheets.find((h) => normalizar(h.name) === normalizar(nombre))
    if (!encontrada) errores.push(`Falta la hoja "${nombre}".`)
    return encontrada
  }

  // Número >= 0 en múltiplos de 0.5; vacío = null
  const racion = (v: unknown, nombreHoja: string, fila: number): number | null => {
    const t = texto(v).replace(',', '.')
    if (t === '') return null
    const n = Number(t)
    if (Number.isNaN(n) || n < 0 || (n * 2) % 1 !== 0) {
      error(nombreHoja, fila, `"${t}" no es una ración válida (usa múltiplos de 0.5)`)
      return null
    }
    return n
  }

  const tipo: TipoArchivo = libro.worksheets.some(
    (h) => normalizar(h.name) === normalizar(HOJAS.opciones)
  )
    ? 'sesion'
    : 'plantilla'

  // ---- Metas
  const metaDiaria = Object.fromEntries(GRUPOS.map((g) => [g.key, 0])) as Record<
    GrupoAlimenticio,
    number
  >
  const hojaMetas = hoja(HOJAS.metas)
  if (hojaMetas)
    for (const f of leerFilas(hojaMetas)) {
      const nombre = texto(f.valor(COL.grupo))
      if (!nombre) continue
      const grupo = grupoPorNombre.get(normalizar(nombre))
      if (!grupo) error(HOJAS.metas, f.numero, `no existe el grupo "${nombre}"`)
      else metaDiaria[grupo] = racion(f.valor(COL.meta), HOJAS.metas, f.numero) ?? 0
    }

  // ---- Comidas
  const comidas: Comida[] = []
  const hojaComidas = hoja(HOJAS.comidas)
  if (hojaComidas)
    for (const f of leerFilas(hojaComidas)) {
      const nombre = texto(f.valor(COL.comida))
      const clave = texto(f.valor(COL.clave)) || normalizar(nombre).replace(/\s+/g, '-')
      if (!nombre) {
        if (texto(f.valor(COL.clave)))
          error(HOJAS.comidas, f.numero, 'falta el nombre de la comida')
        continue
      }
      if (comidas.some((c) => c.id === clave)) {
        error(HOJAS.comidas, f.numero, `la clave "${clave}" está repetida`)
        continue
      }
      const celdas = Object.fromEntries(
        GRUPOS.map((g): [GrupoAlimenticio, Celda] => {
          const nota = texto(f.valor(notaDe(g.etiqueta)))
          return [
            g.key,
            {
              racion: racion(f.valor(g.etiqueta), HOJAS.comidas, f.numero),
              ...(nota ? { nota } : {})
            }
          ]
        })
      ) as Record<GrupoAlimenticio, Celda>
      comidas.push({ id: clave, nombre, hora: texto(f.valor(COL.hora)), celdas, opciones: [] })
    }
  if (hojaComidas && comidas.length === 0) errores.push(`La hoja "${HOJAS.comidas}" está vacía.`)

  // ---- Etiquetas
  const etiquetas: Etiqueta[] = []
  const etiquetaPorNombre = new Map<string, string>()
  const agregarEtiqueta = (nombre: string, clave?: string): string => {
    const id = clave || nuevoId()
    etiquetas.push({ id, nombre })
    etiquetaPorNombre.set(normalizar(nombre), id)
    return id
  }
  const hojaEtiquetas = hoja(HOJAS.etiquetas)
  if (hojaEtiquetas)
    for (const f of leerFilas(hojaEtiquetas)) {
      const nombre = texto(f.valor(COL.nombre))
      if (!nombre) continue
      if (etiquetaPorNombre.has(normalizar(nombre)))
        error(HOJAS.etiquetas, f.numero, `la etiqueta "${nombre}" está repetida`)
      else agregarEtiqueta(nombre, texto(f.valor(COL.clave)))
    }

  // ---- Mis alimentos (los archivos de antes no tienen esta hoja, por eso no es obligatoria)
  const alimentos: Alimento[] = []
  const hojaAlimentos = libro.worksheets.find(
    (h) => normalizar(h.name) === normalizar(HOJAS.alimentos)
  )
  if (hojaAlimentos)
    for (const f of leerFilas(hojaAlimentos)) {
      const nombre = texto(f.valor(COL.nombre))
      if (!nombre) continue
      const nombreGrupo = texto(f.valor(COL.grupo))
      const grupo = grupoPorNombre.get(normalizar(nombreGrupo))
      const nombreSubgrupo = texto(f.valor(COL.subgrupo))
      const subgrupo = SUBGRUPOS.find((sg) => sg === nombreSubgrupo)
      const unidad = UNIDADES.find((u) => u === texto(f.valor(COL.unidad)))
      const cantidad = Number(texto(f.valor(COL.cantidad)).replace(',', '.'))
      const gramos = Number(texto(f.valor(COL.gramos)).replace(',', '.'))
      const repetido = alimentosPorNombre([...ALIMENTOS, ...alimentos]).has(normalizar(nombre))
      if (repetido) error(HOJAS.alimentos, f.numero, `ya existe un alimento llamado "${nombre}"`)
      else if (!grupo) error(HOJAS.alimentos, f.numero, `no existe el grupo "${nombreGrupo}"`)
      else if (nombreSubgrupo && !subgrupo)
        error(HOJAS.alimentos, f.numero, `no existe el subgrupo "${nombreSubgrupo}"`)
      else if (!unidad)
        error(HOJAS.alimentos, f.numero, `la unidad debe ser una de: ${UNIDADES.join(', ')}`)
      else if (!(cantidad > 0) || !(gramos > 0))
        error(HOJAS.alimentos, f.numero, 'la cantidad y los gramos deben ser mayores a 0')
      else
        alimentos.push({
          id: texto(f.valor(COL.clave)) || nuevoId(),
          nombre,
          grupo,
          ...(subgrupo ? { subgrupo } : {}),
          cantidad,
          unidad,
          gramos
        })
    }
  const alimentoPorNombre = alimentosPorNombre([...ALIMENTOS, ...alimentos])

  // ---- Opciones y Mis comidas: filas agrupadas por número, una por ingrediente
  const leerOpciones = (
    nombreHoja: string,
    filas: Fila[],
    claveGrupo: (f: Fila) => string | null
  ): Map<string, Opcion> => {
    const opciones = new Map<string, Opcion>()
    for (const f of filas) {
      const clave = claveGrupo(f)
      if (clave === null) continue
      let op = opciones.get(clave)
      if (!op) {
        op = { id: nuevoId(), titulo: '', ingredientes: [] }
        opciones.set(clave, op)
      }
      op.titulo ||= texto(f.valor(COL.titulo))
      const nota = texto(f.valor(COL.nota))
      if (nota && !op.nota) op.nota = nota

      const nombreAlimento = texto(f.valor(COL.alimento))
      if (!nombreAlimento) continue
      const alimentoId = alimentoPorNombre.get(normalizar(nombreAlimento))
      const eq = interpretarEquivalentes(texto(f.valor(COL.equivalentes)) || '1')
      if (!alimentoId) error(nombreHoja, f.numero, `no existe el alimento "${nombreAlimento}"`)
      else if (eq === 'invalido')
        error(nombreHoja, f.numero, 'los equivalentes deben ser múltiplos de 0.25 mayores a 0')
      else op.ingredientes.push({ id: nuevoId(), alimentoId, equivalentes: eq } as Ingrediente)
    }
    return opciones
  }

  const hojaRecetario = hoja(HOJAS.recetario)
  const recetario: Opcion[] = []
  if (hojaRecetario) {
    const filas = leerFilas(hojaRecetario)
    const recetas = leerOpciones(HOJAS.recetario, filas, (f) => {
      const n = texto(f.valor(COL.numeroReceta))
      if (!n && !texto(f.valor(COL.alimento))) return null
      if (!n) error(HOJAS.recetario, f.numero, 'falta el número de receta')
      return n || null
    })
    // Etiquetas de cada receta: se toman de su primera fila; las que no existen se crean
    for (const f of filas) {
      const r = recetas.get(texto(f.valor(COL.numeroReceta)))
      if (!r || r.etiquetas) continue
      r.etiquetas = texto(f.valor(COL.etiquetas))
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((nombre) => etiquetaPorNombre.get(normalizar(nombre)) ?? agregarEtiqueta(nombre))
    }
    for (const r of recetas.values()) {
      if (!r.titulo) errores.push(`Hoja "${HOJAS.recetario}": hay una receta sin título.`)
      recetario.push(r)
    }
  }

  if (tipo === 'sesion') {
    const hojaOpciones = hoja(HOJAS.opciones)!
    const opciones = leerOpciones(HOJAS.opciones, leerFilas(hojaOpciones), (f) => {
      const comida = texto(f.valor(COL.comida))
      const numero = texto(f.valor(COL.numero))
      if (!comida && !numero) return null
      if (!comidas.some((c) => c.id === comida)) {
        error(
          HOJAS.opciones,
          f.numero,
          `no existe la comida con clave "${comida}" (ver hoja Comidas)`
        )
        return null
      }
      return `${comida}\u0000${numero}`
    })
    for (const [clave, op] of opciones) {
      const comida = comidas.find((c) => c.id === clave.split('\u0000')[0])!
      comida.opciones.push(op)
    }
  }

  if (errores.length > 0) return { errores }
  return { plan: { metaDiaria, comidas, recetario, etiquetas, alimentos }, tipo }
}
