import type { Alimento, GrupoAlimenticio, SubGrupoAlimenticio, Unidad } from './tipos'

type FilaCatalogo = [string, string, number, Unidad, number, SubGrupoAlimenticio?]

// Convierte [id, nombre, cantidad, unidad, gramos, subgrupo?] en Alimento
const grupo = (g: GrupoAlimenticio, filas: FilaCatalogo[]): Alimento[] =>
  filas.map(([id, nombre, cantidad, unidad, gramos, subgrupo]) => ({
    id,
    nombre,
    grupo: g,
    subgrupo,
    cantidad,
    unidad,
    gramos
  }))

// Cada fila es 1 equivalente. Valores tomados del menú ejemplo y del SMAE: verificar antes de usar.
export const ALIMENTOS: Alimento[] = [
  ...grupo('verduras', [
    ['nopal', 'nopal cocido', 1, 'tza', 149],
    ['ejote', 'ejotes cocidos', 0.5, 'tza', 63],
    ['brocoli', 'brócoli cocido', 0.5, 'tza', 92],
    ['calabacita', 'calabacita cocida', 0.5, 'tza', 90],
    ['champinon', 'champiñones cocidos', 0.5, 'tza', 78],
    ['espinaca', 'espinaca cocida', 0.5, 'tza', 90],
    ['lechuga', 'lechuga', 3, 'tza', 135],
    ['jitomate', 'jitomate', 1, 'pza', 123],
    ['pepino', 'pepino sin semilla', 1, 'tza', 104],
    ['zanahoria', 'zanahoria picada', 0.5, 'tza', 64],
    ['jicama', 'jícama picada', 0.5, 'tza', 60]
  ]),
  ...grupo('frutas', [
    ['manzana', 'manzana', 1, 'pza', 106],
    ['fresa', 'fresas', 1, 'tza', 166],
    ['frutos-rojos', 'frutos rojos', 1, 'tza', 140],
    ['guayaba', 'guayaba', 2, 'pza', 84],
    ['papaya', 'papaya picada', 1, 'tza', 140],
    ['naranja', 'naranja con gajos', 1, 'pza', 152],
    ['platano', 'plátano', 0.5, 'pza', 54]
  ]),
  ...grupo('cereales', [
    ['tortilla', 'tortilla de maíz', 1, 'pza', 30, 'cereal_sin_grasa'],
    ['tostada', 'tostada de maíz deshidratada', 1, 'pza', 20, 'cereal_sin_grasa'],
    ['arroz', 'arroz cocido', 0.25, 'tza', 43, 'cereal_sin_grasa'],
    ['avena', 'avena en hojuelas', 3, 'cda', 20, 'cereal_sin_grasa'],
    ['salma', 'galleta salma', 3, 'pza', 21, 'cereal_sin_grasa'],
    ['arroz-inflado', 'galleta de arroz inflado', 2, 'pza', 18, 'cereal_sin_grasa'],
    ['pan-integral', 'pan integral', 1, 'rda', 27, 'cereal_sin_grasa']
  ]),
  ...grupo('leguminosas', [['frijol', 'frijoles de la olla', 0.5, 'tza', 86]]),
  ...grupo('poa', [
    ['pollo', 'pechuga de pollo', 30, 'g', 30, 'poa_muy_bajo'],
    ['clara', 'clara de huevo', 2, 'pza', 66, 'poa_muy_bajo'],
    ['atun', 'atún en agua', 30, 'g', 30, 'poa_muy_bajo'],
    ['panela', 'queso panela', 2, 'rda', 45, 'poa_bajo'],
    ['res', 'bistec de res', 30, 'g', 30, 'poa_bajo'],
    ['huevo', 'huevo entero', 1, 'pza', 50, 'poa_moderado'],
    ['oaxaca-light', 'queso Oaxaca light', 2, 'rda', 45, 'poa_moderado'],
    ['salmon', 'salmón', 30, 'g', 30, 'poa_moderado'],
    ['sardina', 'sardina', 30, 'g', 30, 'poa_moderado']
  ]),
  ...grupo('lacteos', [
    ['leche-descremada', 'leche descremada', 1, 'tza', 240, 'lacteos_descremada'],
    ['yogurt-griego', 'yogurt griego natural', 0.5, 'tza', 120, 'lacteos_descremada']
  ]),
  ...grupo('grasas', [
    ['aceite-oliva', 'aceite de oliva', 1, 'cdita', 5, 'grasa_sin_proteina'],
    ['aceite-aguacate', 'aceite de aguacate', 1, 'cdita', 5, 'grasa_sin_proteina'],
    ['aguacate', 'aguacate', 1 / 3, 'pza', 30, 'grasa_sin_proteina'],
    ['mayonesa-light', 'mayonesa light', 2, 'cdita', 12, 'grasa_sin_proteina'],
    ['almendra', 'almendras', 10, 'pza', 12, 'grasa_con_proteina'],
    ['nuez', 'mitades de nuez', 6, 'pza', 9, 'grasa_con_proteina'],
    ['cacahuate', 'cacahuates sin sal', 10, 'pza', 10, 'grasa_con_proteina'],
    ['crema-cacahuate', 'crema de cacahuate sin azúcar', 1, 'cda', 10, 'grasa_con_proteina']
  ]),
  ...grupo('azucares', [['azucar', 'azúcar', 2, 'cdita', 10]])
]

export const UNIDADES: Unidad[] = ['pza', 'tza', 'cdita', 'cda', 'rda', 'g']

export const SUBGRUPOS: SubGrupoAlimenticio[] = [
  'cereal_sin_grasa',
  'cereal_con_grasa',
  'poa_muy_bajo',
  'poa_bajo',
  'poa_moderado',
  'grasa_sin_proteina',
  'grasa_con_proteina',
  'lacteos_descremada',
  'lacteos_semidescremada',
  'lacteos_entera',
  'lacteos_con_azucar'
]

// Los subgrupos empiezan con el prefijo de su grupo: 'poa_bajo' -> poa
const PREFIJO_SUBGRUPO: Partial<Record<GrupoAlimenticio, string>> = {
  cereales: 'cereal_',
  poa: 'poa_',
  grasas: 'grasa_',
  lacteos: 'lacteos_'
}

export const subgruposDe = (g: GrupoAlimenticio): SubGrupoAlimenticio[] => {
  const prefijo = PREFIJO_SUBGRUPO[g]
  return prefijo ? SUBGRUPOS.filter((s) => s.startsWith(prefijo)) : []
}

export type Catalogo = Map<string, Alimento>

// Los alimentos fijos más los que se agregaron en este plan (plan.alimentos)
export const crearCatalogo = (propios: Alimento[]): Catalogo =>
  new Map([...ALIMENTOS, ...propios].map((a) => [a.id, a]))

// Mínimo cambio en equivalentes al ajustar cantidades, para no dar ½ huevo o 2.5 almendras.
// Los que no están aquí van de ¼ en ¼.
const PASOS: Record<string, number> = {
  huevo: 1, // 1 pieza
  clara: 0.5, // 1 clara
  tortilla: 0.5,
  tostada: 1,
  salma: 1, // 3 galletas
  'arroz-inflado': 0.5, // 1 galleta
  'pan-integral': 1,
  panela: 0.5, // 1 rebanada
  'oaxaca-light': 0.5,
  jitomate: 0.5,
  manzana: 0.5,
  naranja: 0.5,
  guayaba: 0.5,
  platano: 1, // ½ plátano
  'aceite-oliva': 0.5,
  'aceite-aguacate': 0.5,
  almendra: 0.5, // 5 almendras
  nuez: 0.5 // 3 mitades
}

export const pasoDe = (alimentoId: string): number => PASOS[alimentoId] ?? 0.25

const FRACCIONES: [number, string][] = [
  [0, ''],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [1, '']
]

// Redondea a la fracción casera más cercana: 1.5 -> "1 ½", 0.33 -> "⅓"
export function fraccion(n: number): string {
  let entero = Math.floor(n)
  const resto = n - entero
  const [valor, simbolo] = FRACCIONES.reduce((mejor, f) =>
    Math.abs(resto - f[0]) < Math.abs(resto - mejor[0]) ? f : mejor
  )
  if (valor === 1) entero += 1
  if (simbolo === '') return entero.toString()
  return entero > 0 ? `${entero} ${simbolo}` : simbolo
}

const PLURAL: Record<Unidad, string> = {
  pza: 'pzas',
  tza: 'tzas',
  cdita: 'cditas',
  cda: 'cdas',
  rda: 'rdas',
  g: 'g'
}

// Texto de la porción para cierto número de equivalentes: "2 rdas de queso panela (90 g)"
export function porcion(a: Alimento, eq: number): string {
  const cant = eq * a.cantidad
  if (a.unidad === 'g') return `${Math.round(cant)} g de ${a.nombre}`
  const unidad = cant > 1 ? PLURAL[a.unidad] : a.unidad
  return `${fraccion(cant)} ${unidad} de ${a.nombre} (${Math.round(eq * a.gramos)} g)`
}
