import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api: Window['api'] = {
  exportarMenu: (datos, formato) => ipcRenderer.invoke('exportar-menu', datos, formato),
  guardarSesion: (datos) => ipcRenderer.invoke('guardar-sesion', datos),
  abrirSesion: () => ipcRenderer.invoke('abrir-sesion'),
  guardarPlantilla: (datos) => ipcRenderer.invoke('guardar-plantilla', datos),
  leerPlantilla: () => ipcRenderer.invoke('leer-plantilla'),
  mostrarPlantilla: () => ipcRenderer.invoke('mostrar-plantilla'),
  avisarCambios: (sinGuardar) => ipcRenderer.send('cambios-sin-guardar', sinGuardar),
  alPedirGuardarYSalir: (callback) => {
    const escucha = (): void => callback()
    ipcRenderer.on('guardar-y-salir', escucha)
    return () => ipcRenderer.removeListener('guardar-y-salir', escucha)
  },
  cerrarVentana: () => ipcRenderer.send('cerrar-ventana')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
