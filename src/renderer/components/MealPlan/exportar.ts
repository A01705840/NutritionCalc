import { crearCatalogo, fraccion } from './Catalogo'
import { lineasOpcion } from './plan'
import { GRUPOS } from './tipos'
import type { PlanAlimenticio } from './tipos'

// Convierte el plan en los datos que llenan las etiquetas de resources/plantilla-menu.docx
export function datosDocx(plan: PlanAlimenticio): DatosMenuDocx {
  const catalogo = crearCatalogo(plan.alimentos)
  return {
    fecha: new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    tiempos: plan.comidas
      .filter((comida) => comida.opciones.length > 0)
      .map((comida) => ({
        nombre: comida.nombre.toUpperCase(),
        hora: comida.hora,
        equivalentes: GRUPOS.filter((g) => comida.celdas[g.key].racion)
          .map((g) => `${g.etiqueta}: ${fraccion(comida.celdas[g.key].racion!)}`)
          .join('  ·  '),
        filas: enFilas(
          comida.opciones.map((op, i) => ({
            numero: i + 1,
            titulo: op.titulo.trim() || `Opción ${i + 1}`,
            lineas: lineasOpcion(op, catalogo).map((texto) => ({ texto })),
            nota: op.nota?.trim() ?? ''
          }))
        )
      }))
  }
}

// La tabla de la plantilla tiene 3 celdas por fila ({#c1}, {#c2}, {#c3}) y la fila se repite.
// [op1..op4] -> [{c1: op1, c2: op2, c3: op3}, {c1: op4, c2: null, c3: null}]
function enFilas(opciones: OpcionDocx[]): DatosMenuDocx['tiempos'][number]['filas'] {
  const filas: DatosMenuDocx['tiempos'][number]['filas'] = []
  for (let i = 0; i < opciones.length; i += 3) {
    const [c1 = null, c2 = null, c3 = null] = opciones.slice(i, i + 3)
    filas.push({ c1, c2, c3 })
  }
  return filas
}
