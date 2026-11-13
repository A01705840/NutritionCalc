import { BrowserWindow, dialog, ipcMain } from 'electron'
import type { IpcMainEvent } from 'electron'

// Si la sesión tiene cambios sin guardar, pregunta antes de cerrar la ventana.
// La pantalla avisa cada vez que cambia el estado ('cambios-sin-guardar').
export function vigilarCierre(ventana: BrowserWindow): void {
  let sinGuardar = false
  let permitirCierre = false

  const deEstaVentana = (evento: IpcMainEvent): boolean => evento.sender === ventana.webContents

  const alCambiar = (evento: IpcMainEvent, hay: boolean): void => {
    if (deEstaVentana(evento)) sinGuardar = hay
  }
  // La pantalla ya guardó (después de "Guardar sesión…" en el diálogo)
  const alPedirCierre = (evento: IpcMainEvent): void => {
    if (!deEstaVentana(evento)) return
    permitirCierre = true
    ventana.close()
  }
  ipcMain.on('cambios-sin-guardar', alCambiar)
  ipcMain.on('cerrar-ventana', alPedirCierre)

  ventana.on('close', (evento) => {
    if (permitirCierre || !sinGuardar) return
    evento.preventDefault()
    const respuesta = dialog.showMessageBoxSync(ventana, {
      type: 'warning',
      title: 'Cambios sin guardar',
      message: 'Tienes cambios sin guardar en esta sesión.',
      detail: '¿Quieres guardarlos antes de salir?',
      buttons: ['Guardar sesión…', 'Salir sin guardar', 'Cancelar'],
      defaultId: 0,
      cancelId: 2,
      noLink: true
    })
    // Guardar: la pantalla arma el Excel y, si se guardó, pide cerrar con 'cerrar-ventana'
    if (respuesta === 0) ventana.webContents.send('guardar-y-salir')
    if (respuesta === 1) {
      permitirCierre = true
      setImmediate(() => ventana.close())
    }
  })

  ventana.on('closed', () => {
    ipcMain.removeListener('cambios-sin-guardar', alCambiar)
    ipcMain.removeListener('cerrar-ventana', alPedirCierre)
  })
}
