import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import { BookingProvider } from '@/state/BookingContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* "user" turns off movement animations for people who asked their device for reduced motion. */}
    <MotionConfig reducedMotion="user">
      <BookingProvider>
        <App />
      </BookingProvider>
    </MotionConfig>
  </React.StrictMode>,
)
