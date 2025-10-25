import { showSuccess, showError, showInfo, confirm } from './toast_impl'

const toast = {
  success: (title: string, description?: string, opts?: any) => showSuccess(title, description, opts),
  error: (title: string, description?: string, opts?: any) => showError(title, description, opts),
  info: (title: string, description?: string, opts?: any) => showInfo(title, description, opts),
  show: (title: string, description?: string, opts?: any) => showInfo(title, description, opts),
}

export { showSuccess, showError, showInfo, confirm }

export default toast
