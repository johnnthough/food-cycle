import React from 'react'
import ReactDOM from 'react-dom/client' // <--- Ensure this line exists!
import App from './App.jsx'
import './index.css'

// Standard render without Strict Mode to save memory
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
