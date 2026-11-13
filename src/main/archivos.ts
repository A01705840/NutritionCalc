import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { describirError } from './exportarMenu'

const EXCEL = { name: 'Libro de Excel', extensions: ['xlsx'] }

// La plantilla vive en la carpeta de datos de la app; cada sesión nueva abre con ella
const rutaPlantilla = (): string => join(app.getPath('userData'), 'plantilla-plan.xlsx')

const ventanaDe = (evento: IpcMainInvokeEvent): BrowserWindow | undefined =>
  BrowserWindow.fromWebContents(evento.sender) ?? undefined

async function escribir(ruta: string, datos: Uint8Array): Promise<ResultadoExportacion> {
  try {
    await writeFile(ruta, datos)
    return { ruta }
  } catch (e) {
    const mensaje = describirError(e)
    console.error(`[archivos] ${mensaje}\n`, e instanceof Error ? e.stack : e)
    return { error: mensaje }
  }
}

async function leer(ruta: string): Promise<ArchivoLeido> {
  try {
    return { ruta, datos: new Uint8Array(await readFile(ruta)) }
  } catch (e) {
    const mensaje = describirError(e)
    console.error(`[archivos] ${mensaje}\n`, e instanceof Error ? e.stack : e)
    return { error: mensaje }
  }
}

export function registrarArchivos(): void {
  ipcMain.handle('guardar-sesion', async (evento, datos: Uint8Array) => {
    const fecha = new Date().toISOString().slice(0, 10)
    const opciones = {
      title: 'Guardar sesión',
      defaultPath: `Sesion ${fecha}.xlsx`,
      filters: [EXCEL]
    }
    const ventana = ventanaDe(evento)
    const { canceled, filePath } = ventana
      ? await dialog.showSaveDialog(ventana, opciones)
      : await dialog.showSaveDialog(opciones)
    if (canceled || !filePath) return {}
    return escribir(filePath, datos)
  })

  ipcMain.handle('abrir-sesion', async (evento): Promise<ArchivoLeido> => {
    const opciones = {
      title: 'Abrir sesión',
      filters: [EXCEL],
      properties: ['openFile' as const]
    }
    const ventana = ventanaDe(evento)
    const { canceled, filePaths } = ventana
      ? await dialog.showOpenDialog(ventana, opciones)
      : await dialog.showOpenDialog(opciones)
    if (canceled || filePaths.length === 0) return {}
    return leer(filePaths[0])
  })

  ipcMain.handle('guardar-plantilla', (_evento, datos: Uint8Array) =>
    escribir(rutaPlantilla(), datos)
  )

  // Sin plantilla guardada regresa {} y la app usa la de fábrica
  ipcMain.handle('leer-plantilla', (): Promise<ArchivoLeido> | ArchivoLeido =>
    existsSync(rutaPlantilla()) ? leer(rutaPlantilla()) : {}
  )

  // Abre el Explorador en la plantilla (o en la carpeta, si todavía no hay plantilla)
  ipcMain.handle('mostrar-plantilla', async () => {
    if (existsSync(rutaPlantilla())) shell.showItemInFolder(rutaPlantilla())
    else await shell.openPath(app.getPath('userData'))
  })
}
