// Tipos compartidos entre main, preload y renderer.
// No van en index.d.ts porque TypeScript lo ignora en tsconfig.node.json (existe index.ts).
export {}

declare global {
  // Una opción del menú, tal como se escribe en una celda de la tabla
  interface OpcionDocx {
    numero: number
    titulo: string
    lineas: { texto: string }[]
    nota: string
  }

  // Datos que llenan las etiquetas de resources/plantilla-menu.docx
  interface DatosMenuDocx {
    fecha: string
    tiempos: {
      nombre: string
      hora: string
      equivalentes: string
      // Filas de la tabla, 3 opciones por fila; null = celda vacía
      filas: { c1: OpcionDocx | null; c2: OpcionDocx | null; c3: OpcionDocx | null }[]
    }[]
  }

  type FormatoMenu = 'docx' | 'pdf'

  // ruta = archivo guardado; sin ruta ni error = el usuario canceló
  interface ResultadoExportacion {
    ruta?: string
    error?: string
  }

  // datos = contenido del archivo; vacío = el usuario canceló (o no hay plantilla guardada)
  interface ArchivoLeido {
    ruta?: string
    datos?: Uint8Array
    error?: string
  }

  interface Window {
    api: {
      exportarMenu: (datos: DatosMenuDocx, formato: FormatoMenu) => Promise<ResultadoExportacion>
      // Sesión: Excel con todo el plan, donde el usuario elija
      guardarSesion: (datos: Uint8Array) => Promise<ResultadoExportacion>
      abrirSesion: () => Promise<ArchivoLeido>
      // Plantilla: Excel en la carpeta de la app con el que abren las sesiones nuevas
      guardarPlantilla: (datos: Uint8Array) => Promise<ResultadoExportacion>
      leerPlantilla: () => Promise<ArchivoLeido>
      mostrarPlantilla: () => Promise<void>
      // Cierre de la ventana con cambios sin guardar
      avisarCambios: (sinGuardar: boolean) => void
      alPedirGuardarYSalir: (callback: () => void) => () => void // regresa cómo dejar de escuchar
      cerrarVentana: () => void
    }
  }
}
