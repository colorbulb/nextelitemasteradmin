import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import './App.css'

const ADMIN_EMAIL = 'teacher@nextelite.ai'

// Global flag to track if we're creating a user (to suppress access denied alert)
window.isCreatingUser = false

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const creatingUserRef = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setUser(currentUser)
        creatingUserRef.current = false
        window.isCreatingUser = false
        
        // Record login
        try {
          const { userService } = await import('./services/userService')
          await userService.recordLogin(currentUser.email, currentUser.uid)
        } catch (error) {
          console.warn('Failed to record login:', error)
        }
      } else if (currentUser) {
        // User is logged in but not admin
        // Check if we're in the process of creating a user
        if (window.isCreatingUser || creatingUserRef.current) {
          // Silently sign out without showing alert
          auth.signOut()
          setUser(null)
        } else {
          // Normal case - show access denied
          auth.signOut()
          setUser(null)
          alert('Access denied. Only admin users can access this portal.')
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="App">
      {user ? <Dashboard user={user} /> : <Login />}
    </div>
  )
}

export default App

