import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { execFile } from 'child_process'
import { randomUUID } from 'crypto'
import { readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import plantilla from '../../resources/plantilla-menu.docx?asset'

const FILTROS: Record<FormatoMenu, { name: string; extensions: string[] }> = {
  docx: { name: 'Documento de Word', extensions: ['docx'] },
  pdf: { name: 'PDF', extensions: ['pdf'] }
}

// Llena la plantilla con los datos del menú, pide dónde guardarlo y lo abre
export function registrarExportarMenu(): void {
  ipcMain.handle(
    'exportar-menu',
    async (evento, datos: DatosMenuDocx, formato: FormatoMenu): Promise<ResultadoExportacion> => {
      const ventana = BrowserWindow.fromWebContents(evento.sender)
      const opciones = {
        title: 'Guardar menú',
        defaultPath: `Menu.${formato}`,
        filters: [FILTROS[formato]]
      }
      const { canceled, filePath } = ventana
        ? await dialog.showSaveDialog(ventana, opciones)
        : await dialog.showSaveDialog(opciones)
      if (canceled || !filePath) return {}

      try {
        const zip = new PizZip(await readFile(plantilla))
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          nullGetter: () => '',
          errorLogging: false // el resumen legible lo imprime el catch
        })
        doc.render(datos)
        const docx = doc.getZip().generate({ type: 'nodebuffer' })
        if (formato === 'pdf') await convertirAPdf(docx, filePath)
        else await writeFile(filePath, docx)
        // openPath no lanza error: regresa el mensaje, o '' si todo salió bien
        const errorAlAbrir = await shell.openPath(filePath)
        if (errorAlAbrir)
          console.error('[exportar-menu] No se pudo abrir el archivo:', errorAlAbrir)
        return { ruta: filePath }
      } catch (e) {
        const mensaje = describirError(e)
        console.error(`[exportar-menu] ${mensaje}\n`, e instanceof Error ? e.stack : e)
        return { error: mensaje }
      }
    }
  )
}

// Word abre el docx (solo lectura, sin mostrarse) y lo guarda como PDF; 17 = wdExportFormatPDF.
// Las rutas van por variables de entorno para no tener que escaparlas dentro del script.
const SCRIPT_PDF = [
  "$ErrorActionPreference = 'Stop'",
  '$word = New-Object -ComObject Word.Application',
  '$word.Visible = $false',
  '$word.DisplayAlerts = 0',
  'try {',
  '  $doc = $word.Documents.Open($env:MENU_DOCX, $false, $true)',
  '  try { $doc.ExportAsFixedFormat($env:MENU_PDF, 17) } finally { $doc.Close($false) }',
  '} finally { $word.Quit() }'
].join('\n')

// El PDF sale idéntico al Word porque lo convierte el mismo Word (requiere Windows con Word)
async function convertirAPdf(docx: Buffer, rutaPdf: string): Promise<void> {
  if (process.platform !== 'win32')
    throw new Error('Exportar a PDF requiere Windows con Microsoft Word instalado.')

  const temporal = join(tmpdir(), `menu-${randomUUID()}.docx`)
  await writeFile(temporal, docx)
  try {
    await promisify(execFile)(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', SCRIPT_PDF],
      { env: { ...process.env, MENU_DOCX: temporal, MENU_PDF: rutaPdf }, timeout: 120_000 }
    )
  } catch (e) {
    const salida = (e as { stderr?: string }).stderr?.trim()
    throw new Error(
      `Word no pudo convertir el menú a PDF. Si el PDF está abierto, ciérralo y vuelve a intentar.\n${salida || (e as Error).message}`,
      { cause: e }
    )
  } finally {
    await rm(temporal, { force: true })
  }
}

interface ErrorPlantilla {
  properties?: { id?: string; xtag?: string; explanation?: string; file?: string }
}

// Convierte el error en un mensaje que diga qué falló y dónde
export function describirError(e: unknown): string {
  if (!(e instanceof Error)) return String(e)

  // Docxtemplater junta los errores de la plantilla en properties.errors ("Multi error")
  const errores = (e as Error & { properties?: { errors?: ErrorPlantilla[] } }).properties?.errors
  if (errores?.length) {
    const detalles = errores.map(
      (err) => `• ${err.properties?.explanation ?? String(err)} (${err.properties?.file ?? '?'})`
    )
    return `La plantilla tiene ${errores.length} error(es):\n${detalles.join('\n')}`
  }

  // Errores al escribir el archivo
  const codigo = (e as NodeJS.ErrnoException).code
  if (codigo === 'EBUSY') return 'El archivo está abierto en Word. Ciérralo y vuelve a exportar.'
  if (codigo === 'EPERM' || codigo === 'EACCES')
    return 'No hay permiso para guardar en esa carpeta. Elige otra ubicación.'
  if (codigo === 'ENOENT') return `No se encontró el archivo: ${e.message}`
  return e.message
}
