import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Sender from './sender.jsx'
import Combiner from './combiner.jsx'

function App() {
  return (
    <BrowserRouter>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 24,
        fontFamily: 'Inter, system-ui, Arial',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          padding: '16px 24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            margin: 0,
            background: 'linear-gradient(45deg, #007bff, #6610f2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '24px'
          }}>
            Doc Share + Blockchain
          </h1>
          <nav style={{
            display: 'flex',
            gap: 16
          }}>
            {[
              { to: '/send', label: '📤 Sender' },
              { to: '/combine', label: '📥 Receiver' }
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '8px 16px',
                  textDecoration: 'none',
                  color: '#495057',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#e9ecef'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
        <main style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
        }}>
          <Routes>
            <Route path="/" element={<Navigate to="/send" />} />
            <Route path="/send" element={<Sender />} />
            <Route path="/combine" element={<Combiner />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
