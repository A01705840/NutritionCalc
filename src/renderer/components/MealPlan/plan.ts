import { crearCatalogo, pasoDe, porcion } from './Catalogo'
import type { Catalogo } from './Catalogo'
import { GRUPOS } from './tipos'
import type {
  Alimento,
  Celda,
  Comida,
  Etiqueta,
  GrupoAlimenticio,
  Ingrediente,
  Opcion,
  PlanAlimenticio
} from './tipos'

export const nuevoId = (): string => crypto.randomUUID()

// Construye una comida con los grupos vacios, luego los llena con los valores de la comida pasada como parametro
function crearComida(
  id: string,
  nombre: string,
  hora: string,
  // Partial porque no todas las celdas tienen que estar definidas
  valores: Partial<Record<GrupoAlimenticio, Celda>>,
  opciones: Opcion[] = []
): Comida {
  const vacias = Object.fromEntries(GRUPOS.map((g) => [g.key, { racion: null }])) as Record<
    GrupoAlimenticio,
    Celda
  >
  return { id, nombre, hora, celdas: { ...vacias, ...valores }, opciones }
}

export const crearAlimento = (datos: Omit<Alimento, 'id'>): Alimento => {
  const nuevoAlimento: Alimento = { ...datos, id: nuevoId() }
  return nuevoAlimento
}

const ingrediente = (alimentoId: string, equivalentes: number): Ingrediente => ({
  id: nuevoId(),
  alimentoId,
  equivalentes
})

const receta = (
  titulo: string,
  etiquetas: string[],
  ingredientes: Ingrediente[],
  nota?: string
): Opcion => ({
  id: nuevoId(),
  titulo,
  etiquetas,
  ingredientes,
  nota
})

// Para comparar nombres sin importar acentos ni mayúsculas: " Colación" -> "colacion"
export const normalizar = (texto: string): string =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

// La etiqueta que se llama igual que el tiempo de comida; undefined si no hay
export const etiquetaDeComida = (comida: Comida, etiquetas: Etiqueta[]): string | undefined =>
  etiquetas.find((e) => normalizar(e.nombre) === normalizar(comida.nombre))?.id

const etiquetasIniciales: Etiqueta[] = [
  { id: 'desayuno', nombre: 'Desayuno' },
  { id: 'comida', nombre: 'Comida' },
  { id: 'cena', nombre: 'Cena' },
  { id: 'colacion', nombre: 'Colación' },
  { id: '1/7', nombre: 'Una vez por semana' },
  { id: '2/7', nombre: 'Dos veces por semana' }
]

// Copia con ids nuevos, para que la opción y la receta se editen por separado
export const copiarOpcion = (op: Opcion): Opcion => ({
  ...op,
  id: nuevoId(),
  ingredientes: op.ingredientes.map((ing) => ({ ...ing, id: nuevoId() }))
})

const NOTA_HUEVO =
  'El huevo o las claras pueden prepararse también con champiñones, espinacas, acelgas o mezcla oriental La Huerta.'

const NOTA_COLACION_MANANA =
  'Fruta: 1 manzana, 1 tza de frutos rojos o fresas, o 2 guayabas. Yogurt griego Chobani plain sin azúcar. Cereal: 1.5 cdas de avena, 1 galleta de arroz inflado OKKO o 1 galleta salma. Grasa: 15 almendras, 9 mitades de nuez, 15 mitades de cacahuate sin sal o 1.5 cdas de crema de cacahuate sin azúcar (Central Market HEB).'

const NOTA_COLACION_TARDE =
  'Fruta: 1 manzana, 1 naranja con gajos, 1 tza de frutos rojos, papaya o fresas, 10 uvas o 2 guayabas. Grasa: 15 almendras, 9 mitades de nuez, 15 mitades de cacahuate sin sal o 1.5 cdas de crema de cacahuate sin azúcar. Yogurt griego Chobani plain: 1.5 cdas soperas (60 ml).'

const NOTA_COMIDA =
  'Verdura: cualquiera de la lista (brócoli, sopa de verduras, ensaladas, champiñones, nopales o mezcla mexicana). Arroz o granos ancestrales; sin arroz, 4 tortillas o 4 tostadas. Las tortillas pueden ser 3 tostadas deshidratadas o 9 salmas. Grasa: aceite oleico, de aguacate, Capullo o de oliva, o ¼ pza de aguacate. Agua de limón o pepino sin azúcar.'

// Platillo de comida: POA + verdura, con 3 tortillas, ¼ tza de arroz y 2 cditas de aceite
const platillo = (
  titulo: string,
  base: Ingrediente[],
  nota: string,
  grasas: Ingrediente[] = [ingrediente('aceite-aguacate', 2)]
): Opcion =>
  receta(
    titulo,
    ['comida'],
    [...base, ingrediente('tortilla', 3), ingrediente('arroz', 1), ...grasas],
    nota
  )

const recetarioInicial: Opcion[] = [
  receta(
    'Huevo con ejotes',
    ['desayuno'],
    [
      ingrediente('huevo', 1),
      ingrediente('panela', 1),
      ingrediente('ejote', 1),
      ingrediente('aceite-aguacate', 1),
      ingrediente('tortilla', 2)
    ],
    NOTA_HUEVO
  ),
  receta(
    'Claras a la mexicana o huevo a la mexicana',
    ['desayuno'],
    [ingrediente('clara', 2), ingrediente('aceite-aguacate', 1), ingrediente('tortilla', 2)],
    `Jitomate y cebolla al gusto. ${NOTA_HUEVO}`
  ),
  receta(
    'Huevo con nopales',
    ['desayuno'],
    [
      ingrediente('huevo', 1),
      ingrediente('clara', 1),
      ingrediente('nopal', 0.5),
      ingrediente('aceite-aguacate', 1),
      ingrediente('tortilla', 2)
    ],
    NOTA_HUEVO
  ),
  receta(
    'Quesadillas',
    ['desayuno'],
    [
      ingrediente('tortilla', 2),
      ingrediente('panela', 2),
      ingrediente('aceite-oliva', 1),
      ingrediente('nopal', 0.5)
    ],
    'Queso panela, fresco, ranchero u Oaxaca. El aceite puede cambiarse por 1 rda de aguacate (¼ pza). La ensalada de nopales puede cambiarse por 1 tza de lechuga y jitomate, o champiñones con cebolla.'
  ),
  receta(
    'Nopales con rajas de chile poblano y salsa de tomate',
    ['desayuno'],
    [
      ingrediente('nopal', 1),
      ingrediente('aceite-aguacate', 1),
      ingrediente('panela', 2),
      ingrediente('tostada', 2)
    ],
    'Rajas y salsa de tomate al gusto. Tostadas deshidratadas SANISSIMO, o 6 galletas salmas u horneaditas HEB.'
  ),

  // ---- Cena ----
  receta(
    'Quesadillas de queso Oaxaca',
    ['cena'],
    [
      ingrediente('tortilla', 3),
      ingrediente('oaxaca-light', 2),
      ingrediente('nopal', 1),
      ingrediente('aceite-oliva', 2)
    ],
    'Queso Oaxaca Lala light. Verdura: 1 tza de lechuga y jitomate, ejotes o nopales. El aceite puede cambiarse por 2 rdas de aguacate (½ pza).'
  ),
  receta(
    'Entomatadas',
    ['cena'],
    [
      ingrediente('tortilla', 3),
      ingrediente('pollo', 2),
      ingrediente('nopal', 1),
      ingrediente('aceite-oliva', 2)
    ],
    'Salsa de jitomate libre. Verdura: 1 tza de lechuga y jitomate, ejotes o nopales. El aceite puede cambiarse por 1 rda de aguacate.'
  ),
  receta(
    'Huevo con nopales',
    ['cena'],
    [
      ingrediente('huevo', 1),
      ingrediente('clara', 1),
      ingrediente('nopal', 0.5),
      ingrediente('aceite-aguacate', 2),
      ingrediente('tortilla', 3)
    ],
    'Las 2 claras pueden cambiarse por 2 rdas de queso (45 g).'
  ),
  receta(
    'Enchiladas potosinas',
    ['cena', '1/7'],
    [
      ingrediente('tortilla', 3),
      ingrediente('panela', 0.5),
      ingrediente('nopal', 1),
      ingrediente('aguacate', 1.5)
    ],
    '1 vez por semana. 3 enchiladas potosinas tamaño tortilla normal, en el comal. Queso panela, fresco, ranchero u Oaxaca Lala light. Verdura: 1 tza de lechuga y jitomate, champiñones o nopales.'
  ),
  receta(
    'Tostadas de nopales con queso',
    ['cena'],
    [
      ingrediente('tostada', 3),
      ingrediente('panela', 2),
      ingrediente('nopal', 1),
      ingrediente('aceite-oliva', 2)
    ],
    'Con jitomate y ensalada de nopales con jitomate. El aceite puede cambiarse por ½ pza de aguacate.'
  ),

  // ---- Colaciones ----
  receta(
    'Fruta con yogurt, nueces y avena',
    ['colacion'],
    [
      ingrediente('manzana', 1),
      ingrediente('yogurt-griego', 1),
      ingrediente('nuez', 1.5),
      ingrediente('avena', 0.5)
    ],
    NOTA_COLACION_MANANA
  ),
  receta(
    'Fruta con yogurt, galleta de arroz inflado y crema de cacahuate',
    ['colacion'],
    [
      ingrediente('fresa', 1),
      ingrediente('yogurt-griego', 1),
      ingrediente('arroz-inflado', 0.5),
      ingrediente('crema-cacahuate', 1.5)
    ],
    NOTA_COLACION_MANANA
  ),
  receta(
    'Fruta con yogurt y almendras (sin ejercicio)',
    ['colacion'],
    [ingrediente('frutos-rojos', 1), ingrediente('yogurt-griego', 1), ingrediente('almendra', 1.5)],
    `Para días sin ejercicio: sin avena, salmas ni galletas. ${NOTA_COLACION_MANANA}`
  ),
  receta(
    'Fruta con almendras y yogurt',
    ['colacion'],
    [ingrediente('manzana', 1), ingrediente('almendra', 1.5), ingrediente('yogurt-griego', 0.5)],
    NOTA_COLACION_TARDE
  ),
  receta(
    'Papaya con nueces y yogurt',
    ['colacion'],
    [ingrediente('papaya', 1), ingrediente('nuez', 1.5), ingrediente('yogurt-griego', 0.5)],
    NOTA_COLACION_TARDE
  ),

  // ---- Comida ----
  platillo(
    'Pescado con cebolla, cilantro, perejil y limón',
    [ingrediente('salmon', 4), ingrediente('brocoli', 1)],
    `Hasta 135 g de salmón o 120 g de sardina. Pescado 2 a 3 veces por semana. ${NOTA_COMIDA}`
  ),
  platillo(
    'Fajitas de pollo con cebolla y pimiento morrón',
    [ingrediente('pollo', 4), ingrediente('pepino', 1)],
    NOTA_COMIDA
  ),
  platillo(
    'Pechuga de pollo o pescado con mostaza',
    [ingrediente('pollo', 4), ingrediente('nopal', 1)],
    NOTA_COMIDA
  ),
  platillo(
    'Pechuga de pollo con rodajas de cebolla y champiñones',
    [ingrediente('pollo', 4), ingrediente('champinon', 1)],
    NOTA_COMIDA
  ),
  platillo(
    'Bistec de res con cebolla y calabacita en rodajas',
    [ingrediente('res', 4), ingrediente('calabacita', 1)],
    `Res o cerdo, 2 veces por semana. ${NOTA_COMIDA}`
  ),
  platillo(
    '2 chiles rellenos de queso panela en salsa de tomate',
    [ingrediente('panela', 3.5), ingrediente('brocoli', 1)],
    `160 g de queso panela o ranchero. ${NOTA_COMIDA}`
  ),
  platillo(
    'Pechuga de pollo rellena de queso y flor de calabaza',
    [ingrediente('pollo', 3), ingrediente('panela', 0.5), ingrediente('nopal', 1)],
    `90 g de pechuga rellena de 22 g de queso panela o fresco. ${NOTA_COMIDA}`
  ),
  platillo(
    'Pescado a la veracruzana',
    [ingrediente('salmon', 4), ingrediente('brocoli', 1)],
    `Con recaudo de jitomate, pimiento morrón y 3 aceitunas. ${NOTA_COMIDA}`
  ),
  platillo(
    'Sardina con pico de gallo y aguacate',
    [ingrediente('sardina', 4), ingrediente('jitomate', 1)],
    `El aguacate puede cambiarse por 2 cditas de mayonesa light. ${NOTA_COMIDA}`,
    [ingrediente('aceite-aguacate', 1), ingrediente('aguacate', 1)]
  ),
  platillo(
    'Caldo de pollo con verduras',
    [ingrediente('pollo', 4), ingrediente('calabacita', 0.5), ingrediente('zanahoria', 0.5)],
    NOTA_COMIDA
  )
]

export const planInicial: PlanAlimenticio = {
  metaDiaria: {
    verduras: 3,
    frutas: 2,
    cereales: 9.5,
    leguminosas: 1,
    poa: 8,
    lacteos: 1.5,
    grasas: 9,
    azucares: 0
  },
  comidas: [
    crearComida(
      'desayuno',
      'Desayuno',
      '7:30 am',
      {
        verduras: { racion: 1 },
        cereales: { racion: 2 },
        leguminosas: { racion: 1 },
        poa: { racion: 2 },
        lacteos: { racion: null, nota: 'Yogurt griego ½ taza' },
        grasas: { racion: 2, nota: '(1*)' }
      },
      [
        {
          id: nuevoId(),
          titulo: 'Huevo con ejotes',
          ingredientes: [
            ingrediente('huevo', 1),
            ingrediente('panela', 1),
            ingrediente('ejote', 1),
            ingrediente('aceite-aguacate', 1),
            ingrediente('tortilla', 2)
          ]
        }
      ]
    ),
    crearComida('colacion-1', 'Colación', '10:30 am', {
      frutas: { racion: 1 },
      cereales: { racion: 0.5, nota: '1.5 cda sopera de avena = 25 g' },
      lacteos: { racion: 1 },
      grasas: { racion: 1.5, nota: '* 9 mitades de nuez o ⅓ aguacate' }
    }),
    crearComida('comida', 'Comida', '1:00 pm', {
      verduras: { racion: 1 },
      cereales: { racion: 4, nota: '¼ taza de arroz y 3 tortillas' },
      poa: { racion: 4 },
      grasas: { racion: 2, nota: '(1*)' }
    }),
    crearComida('colacion-2', 'Colación', '4:00 – 4:30 pm', {
      frutas: { racion: 1 },
      lacteos: { racion: 0.5 },
      grasas: { racion: 1.5, nota: '* 15 almendras y 9 mitades de nuez' }
    }),
    crearComida('cena', 'Cena', '7:30 pm', {
      verduras: { racion: 1 },
      cereales: { racion: 3 },
      poa: { racion: 2 },
      grasas: { racion: 2 }
    })
  ],
  recetario: recetarioInicial,
  alimentos: [],
  etiquetas: etiquetasIniciales
}

// ---- Acciones ------

export type Accion =
  | { tipo: 'actualizarCelda'; comidaId: string; grupo: GrupoAlimenticio; celda: Celda }
  | { tipo: 'actualizarMeta'; grupo: GrupoAlimenticio; valor: number }
  | { tipo: 'actualizarHora'; comidaId: string; hora: string }
  | { tipo: 'agregarOpcion'; comidaId: string }
  | { tipo: 'actualizarOpcion'; comidaId: string; opcion: Opcion }
  | { tipo: 'eliminarOpcion'; comidaId: string; opcionId: string }
  | { tipo: 'guardarReceta'; receta: Opcion }
  | { tipo: 'eliminarReceta'; recetaId: string }
  | { tipo: 'usarReceta'; comidaId: string; recetaId: string }
  | { tipo: 'ajustarOpciones'; comidaId: string }
  | { tipo: 'guardarEtiqueta'; etiqueta: Etiqueta }
  | { tipo: 'eliminarEtiqueta'; etiquetaId: string }
  | { tipo: 'cargarPlan'; plan: PlanAlimenticio }
  | { tipo: 'agregarAlimento'; alimento: Alimento }
  | { tipo: 'eliminarAlimento'; alimentoId: string }

// Aplica un cambio solo a la comida indicada
const enComida = (
  plan: PlanAlimenticio,
  comidaId: string,
  cambio: (c: Comida) => Comida
): PlanAlimenticio => ({
  ...plan,
  comidas: plan.comidas.map((comida) => (comida.id === comidaId ? cambio(comida) : comida))
})

export function reducer(plan: PlanAlimenticio, accion: Accion): PlanAlimenticio {
  switch (accion.tipo) {
    case 'actualizarCelda':
      return enComida(plan, accion.comidaId, (comida) => ({
        ...comida,
        celdas: { ...comida.celdas, [accion.grupo]: accion.celda }
      }))
    case 'actualizarMeta':
      return { ...plan, metaDiaria: { ...plan.metaDiaria, [accion.grupo]: accion.valor } }
    case 'actualizarHora':
      return enComida(plan, accion.comidaId, (comida) => ({ ...comida, hora: accion.hora }))
    case 'agregarOpcion':
      return enComida(plan, accion.comidaId, (comida) => ({
        ...comida,
        opciones: [...comida.opciones, { id: nuevoId(), titulo: '', ingredientes: [] }]
      }))
    case 'actualizarOpcion':
      return enComida(plan, accion.comidaId, (comida) => ({
        ...comida,
        opciones: comida.opciones.map((op) => (op.id === accion.opcion.id ? accion.opcion : op))
      }))
    case 'eliminarOpcion':
      return enComida(plan, accion.comidaId, (comida) => ({
        ...comida,
        opciones: comida.opciones.filter((op) => op.id !== accion.opcionId)
      }))
    // Reemplaza la receta si ya existe, si no la agrega al final
    case 'guardarReceta': {
      const existe = plan.recetario.some((r) => r.id === accion.receta.id)
      return {
        ...plan,
        recetario: existe
          ? plan.recetario.map((r) => (r.id === accion.receta.id ? accion.receta : r))
          : [...plan.recetario, accion.receta]
      }
    }
    case 'eliminarReceta':
      return { ...plan, recetario: plan.recetario.filter((r) => r.id !== accion.recetaId) }
    case 'usarReceta': {
      const elegida = plan.recetario.find((r) => r.id === accion.recetaId)
      if (!elegida) return plan
      return enComida(plan, accion.comidaId, (comida) => ({
        ...comida,
        opciones: [...comida.opciones, copiarOpcion(elegida)]
      }))
    }
    case 'ajustarOpciones': {
      const catalogo = crearCatalogo(plan.alimentos)
      return enComida(plan, accion.comidaId, (comida) => ({
        ...comida,
        opciones: comida.opciones.map((op) => ajustarOpcion(op, comida, catalogo))
      }))
    }
    // Crea la etiqueta, o la renombra si ya existe
    case 'guardarEtiqueta': {
      const existe = plan.etiquetas.some((e) => e.id === accion.etiqueta.id)
      return {
        ...plan,
        etiquetas: existe
          ? plan.etiquetas.map((e) => (e.id === accion.etiqueta.id ? accion.etiqueta : e))
          : [...plan.etiquetas, accion.etiqueta]
      }
    }
    // También se quita de las recetas que la tenían
    case 'eliminarEtiqueta':
      return {
        ...plan,
        etiquetas: plan.etiquetas.filter((e) => e.id !== accion.etiquetaId),
        recetario: plan.recetario.map((r) =>
          r.etiquetas?.includes(accion.etiquetaId)
            ? { ...r, etiquetas: r.etiquetas.filter((id) => id !== accion.etiquetaId) }
            : r
        )
      }
    // Reemplaza todo el plan (al abrir una sesión o cargar la plantilla)
    case 'cargarPlan':
      return accion.plan

    case 'agregarAlimento':
      return { ...plan, alimentos: [...plan.alimentos, accion.alimento] }

    // Si alguna opción o receta lo usa no se borra: sus ingredientes se quedarían sin alimento
    case 'eliminarAlimento':
      if (alimentoEnUso(plan, accion.alimentoId)) return plan
      return { ...plan, alimentos: plan.alimentos.filter((a) => a.id !== accion.alimentoId) }
  }
}

// Totales se calculan, no se guardan...
export const asignado = (plan: PlanAlimenticio, g: GrupoAlimenticio): number =>
  plan.comidas.reduce((suma, comida) => suma + (comida.celdas[g].racion ?? 0), 0)

// ---- Validación de opciones ------

export interface Revision {
  grupo: GrupoAlimenticio
  meta: number
  asignado: number
}

// Bloquea los alimentos que estan en uso para que no puedan ser eliminados
export const alimentoEnUso = (plan: PlanAlimenticio, alimentoId: string): boolean => {
  const opciones = [...plan.recetario, ...plan.comidas.flatMap((c) => c.opciones)]
  return opciones.some((op) => op.ingredientes.some((ing) => ing.alimentoId === alimentoId))
}

// Compara los equivalentes de una opción contra la fila de su comida.
// Regresa solo los grupos que intervienen (meta o asignado distinto de 0).
export function revisarOpcion(op: Opcion, fila: Comida, catalogo: Catalogo): Revision[] {
  const suma: Partial<Record<GrupoAlimenticio, number>> = {}
  for (const ing of op.ingredientes) {
    const a = catalogo.get(ing.alimentoId)
    if (!a) continue
    suma[a.grupo] = (suma[a.grupo] ?? 0) + ing.equivalentes
  }
  return GRUPOS.map((g) => ({
    grupo: g.key,
    meta: fila.celdas[g.key].racion ?? 0,
    asignado: suma[g.key] ?? 0
  })).filter((r) => r.meta !== 0 || r.asignado !== 0)
}

export const opcionCuadra = (op: Opcion, fila: Comida, catalogo: Catalogo): boolean =>
  revisarOpcion(op, fila, catalogo).every((r) => r.meta === r.asignado)

// ---- Ajuste de cantidades a la fila ------

const redondearAbajo = (n: number, paso: number): number => Math.floor(n / paso + 1e-9) * paso

// Escala proporcionalmente los ingredientes de un grupo para que sumen `meta`,
// respetando el paso de cada alimento. Si no se llega exacto, queda debajo de la meta.
function ajustarGrupo(ingredientes: Ingrediente[], meta: number): Ingrediente[] {
  const actual = ingredientes.reduce((suma, ing) => suma + ing.equivalentes, 0)
  if (actual === meta || actual === 0) return ingredientes
  if (meta === 0) return []

  const factor = meta / actual
  const ajustados = ingredientes.map((ing) => {
    const paso = pasoDe(ing.alimentoId)
    const ideal = ing.equivalentes * factor
    const redondeado = redondearAbajo(ideal, paso)
    return { ing: { ...ing, equivalentes: redondeado }, perdida: ideal - redondeado, paso }
  })

  // Reparte lo que falta un paso a la vez, primero a los que más perdieron al redondear
  let falta = meta - ajustados.reduce((suma, a) => suma + a.ing.equivalentes, 0)
  const orden = [...ajustados].sort((a, b) => b.perdida - a.perdida)
  let avanzo = true
  while (falta > 1e-9 && avanzo) {
    avanzo = false
    for (const a of orden) {
      if (a.paso > falta + 1e-9) continue
      a.ing.equivalentes += a.paso
      falta -= a.paso
      avanzo = true
    }
  }

  return ajustados.map((a) => a.ing).filter((ing) => ing.equivalentes > 0)
}

// Ajusta todos los grupos de una opción a la fila de su comida.
// Los grupos que la opción no tiene se quedan como faltantes; no se inventan alimentos.
export function ajustarOpcion(op: Opcion, fila: Comida, catalogo: Catalogo): Opcion {
  const porGrupo = new Map<GrupoAlimenticio, Ingrediente[]>()
  for (const ing of op.ingredientes) {
    const a = catalogo.get(ing.alimentoId)
    if (a) porGrupo.set(a.grupo, [...(porGrupo.get(a.grupo) ?? []), ing])
  }

  const ajustados = new Map<string, Ingrediente>()
  for (const [grupo, ingredientes] of porGrupo)
    for (const ing of ajustarGrupo(ingredientes, fila.celdas[grupo].racion ?? 0))
      ajustados.set(ing.id, ing)

  return {
    ...op,
    // Mantiene el orden; los que no están en el catálogo (sin elegir) no se tocan
    ingredientes: op.ingredientes.flatMap((ing) => {
      if (!catalogo.has(ing.alimentoId)) return [ing]
      const nuevo = ajustados.get(ing.id)
      return nuevo ? [nuevo] : []
    })
  }
}

// Una línea de texto por ingrediente ya elegido
export const lineasOpcion = (op: Opcion, catalogo: Catalogo): string[] =>
  op.ingredientes.flatMap((ing) => {
    const a = catalogo.get(ing.alimentoId)
    return a ? [porcion(a, ing.equivalentes)] : []
  })

// Acepta "1", "0.5", "1,25"...; solo múltiplos de 0.25
export function interpretarEquivalentes(texto: string): number | 'invalido' {
  const n = Number(texto.trim().replace(',', '.'))
  if (texto.trim() === '' || Number.isNaN(n) || n <= 0 || (n * 4) % 1 !== 0) return 'invalido'
  return n
}
