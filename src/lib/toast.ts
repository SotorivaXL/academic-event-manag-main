import { showSuccess, showError, showInfo, confirm } from './toast_impl'

// Provide a compatibility `toast` object similar to 'sonner' used in the codebase
const toast = {
  success: (title: string, description?: string, opts?: any) => showSuccess(title, description, opts),
  error: (title: string, description?: string, opts?: any) => showError(title, description, opts),
  info: (title: string, description?: string, opts?: any) => showInfo(title, description, opts),
  // alias for showing simple informational toast
  // call as toast(title) is uncommon; we provide a simple wrapper
  show: (title: string, description?: string, opts?: any) => showInfo(title, description, opts),
}

export { showSuccess, showError, showInfo, confirm }

export default toast
