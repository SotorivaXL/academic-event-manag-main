import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

export type ToastOpts = {
  duration?: number
  key?: string
  modal?: boolean
}

const activeToasts = new Map<string, Promise<any>>()
let modalCount = 0

function isBrowser() {
  return typeof document !== 'undefined'
}

function addOverlay() {
  if (!isBrowser()) return
  if (modalCount === 0) document.documentElement.classList.add('has-sweet-toast')
  modalCount++
}

function removeOverlay() {
  if (!isBrowser()) return
  modalCount = Math.max(0, modalCount - 1)
  if (modalCount === 0) document.documentElement.classList.remove('has-sweet-toast')
}

function makeKey(type: string, title: string, description?: string, providedKey?: string) {
  if (providedKey) return providedKey
  return `${type}::${String(title)}::${String(description ?? '')}`
}

function show(type: 'success' | 'error' | 'info' | 'default', title: string, description?: string, opts?: ToastOpts) {
  const key = makeKey(type, title, description, opts?.key)
  // If a toast/modal with the same key is currently active, return the same promise
  if (activeToasts.has(key)) {
    return activeToasts.get(key) as Promise<any>
  }

  const isModal = !!opts?.modal

  if (isModal) addOverlay()

  const icon = type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'info' ? 'info' : undefined

  if (!isModal) {
    // Toast mode
    const timer = opts?.duration ?? 4000

    const swalConfig: any = {
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      title,
      text: description,
      icon,
      customClass: {},
    }

    // Show and keep a simple identifier in activeToasts until closed
    const promise = Swal.fire(swalConfig).then(() => {
      activeToasts.delete(key)
    })

    activeToasts.set(key, promise)
    return promise
  }

  // Modal mode (centered dialog)
  const modalConfig: any = {
    title,
    text: description,
    icon,
    showCancelButton: false,
    showConfirmButton: true,
    allowOutsideClick: false,
    customClass: { popup: 'sweet-modal' },
  }

  const promise = Swal.fire(modalConfig).then((res: any) => {
    // modal closed
    activeToasts.delete(key)
    removeOverlay()
    return res
  })

  activeToasts.set(key, promise)
  return promise
}

export function showSuccess(title: string, description?: string, opts?: ToastOpts) {
  return show('success', title, description, opts)
}

export function showError(title: string, description?: string, opts?: ToastOpts) {
  return show('error', title, description, opts)
}

export function showInfo(title: string, description?: string, opts?: ToastOpts) {
  return show('info', title, description, opts)
}

// Confirmação com toast custom — retorna Promise<boolean>
export function confirm(
  title: string,
  description?: string,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
): Promise<boolean> {
  const key = makeKey('confirm', title, description)

  // Reuse existing confirm modal if present
  if (activeToasts.has(key)) {
    return activeToasts.get(key) as Promise<boolean>
  }

  if (isBrowser()) addOverlay()

  const promise = Swal.fire({
    title,
    text: description,
    icon: undefined,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    allowOutsideClick: false,
    customClass: { popup: 'sweet-modal' },
  }).then((result) => {
    removeOverlay()
    activeToasts.delete(key)
    return !!result.isConfirmed
  })

  activeToasts.set(key, promise)
  return promise
}
