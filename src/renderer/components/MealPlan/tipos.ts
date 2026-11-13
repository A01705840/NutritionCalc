import type { CSSProperties } from 'react'

export type GrupoAlimenticio =
  'verduras' | 'frutas' | 'cereales' | 'leguminosas' | 'poa' | 'lacteos' | 'grasas' | 'azucares'

export type SubGrupoAlimenticio =
  | 'cereal_sin_grasa'
  | 'cereal_con_grasa'
  | 'poa_muy_bajo'
  | 'poa_bajo'
  | 'poa_moderado'
  | 'grasa_sin_proteina'
  | 'grasa_con_proteina'
  | 'lacteos_descremada'
  | 'lacteos_semidescremada'
  | 'lacteos_entera'
  | 'lacteos_con_azucar'

export type Unidad = 'pza' | 'tza' | 'cdita' | 'cda' | 'rda' | 'g'

export interface Celda {
  racion: number | null
  nota?: string
}

// Un alimento del catálogo: "cantidad unidad" (y "gramos") equivalen a 1 equivalente
export interface Alimento {
  id: string
  nombre: string
  grupo: GrupoAlimenticio
  subgrupo?: SubGrupoAlimenticio
  cantidad: number
  unidad: Unidad
  gramos: number
}

export interface Ingrediente {
  id: string
  alimentoId: string // '' = todavía no se elige
  equivalentes: number
}

// Etiqueta del recetario ("Desayuno", "Una vez por semana"...). Se pueden crear, renombrar y borrar.
// Si el nombre coincide con un tiempo de comida, el recetario filtra por ella al abrirse ahí.
export interface Etiqueta {
  id: string
  nombre: string
}

export interface Opcion {
  id: string
  titulo: string
  ingredientes: Ingrediente[]
  nota?: string
  // Ids de etiquetas (solo se usa en el recetario)
  etiquetas?: string[]
}

export interface Comida {
  id: string
  nombre: string
  hora: string
  celdas: Record<GrupoAlimenticio, Celda>
  opciones: Opcion[]
}

export interface PlanAlimenticio {
  alimentos: Alimento[]
  metaDiaria: Record<GrupoAlimenticio, number>
  comidas: Comida[]
  // "Mis comidas": opciones guardadas para reutilizar en cualquier tiempo de comida
  recetario: Opcion[]
  etiquetas: Etiqueta[]
}

export const GRUPOS: { key: GrupoAlimenticio; etiqueta: string; tint: string; accent: string }[] = [
  { key: 'verduras', etiqueta: 'Verduras', tint: '#E7F6EC', accent: '#1E7A44' },
  { key: 'frutas', etiqueta: 'Frutas', tint: '#FFF1E6', accent: '#C2410C' },
  { key: 'cereales', etiqueta: 'Cereales', tint: '#FFF7DB', accent: '#946200' },
  { key: 'leguminosas', etiqueta: 'Leguminosas', tint: '#F3ECE6', accent: '#7A4E2D' },
  { key: 'poa', etiqueta: 'Prod. origen animal (POA)', tint: '#FDECEC', accent: '#B42318' },
  { key: 'lacteos', etiqueta: 'Lácteos', tint: '#E8F1FD', accent: '#1D5FA8' },
  { key: 'grasas', etiqueta: 'Grasas', tint: '#FFFAD6', accent: '#8A6D00' },
  { key: 'azucares', etiqueta: 'Azúcares', tint: '#FCEAF4', accent: '#A1286A' }
]

// Pasa los colores del grupo al CSS como variables (--tint y --accent)
export const coloresGrupo = (g: { tint: string; accent: string }): CSSProperties =>
  ({ '--tint': g.tint, '--accent': g.accent }) as CSSProperties
