import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TekenPagina from './Teken.jsx'

// Simpele, URL-gebaseerde routing: /tekenen/{id} is de publieke tekenpagina (geen Microsoft-
// login nodig — zie staticwebapp.config.json), alle overige URL's laden de normale, beveiligde
// app. Er wordt bewust geen router-package gebruikt, dit is de enige plek waar dit nodig is.
const pad = window.location.pathname;
const tekenMatch = pad.match(/^\/tekenen\/([^/]+)\/?$/);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {tekenMatch ? <TekenPagina id={decodeURIComponent(tekenMatch[1])} /> : <App />}
  </StrictMode>,
)
