import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App.jsx'

try {
  const savedTheme = localStorage.getItem('theme') || 'light'
  const isDark = savedTheme === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.setAttribute('data-theme', savedTheme)
} catch {
  document.documentElement.classList.remove('dark')
  document.documentElement.setAttribute('data-theme', 'light')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme="light"
    />
  </StrictMode>,
)
