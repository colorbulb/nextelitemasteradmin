// User management service using Firebase Admin SDK
// This requires a backend server with Firebase Admin SDK

// Use deployed Cloud Function URL in production, localhost in development
const getApiBaseUrl = () => {
  // Check if we're in production (deployed)
  if (import.meta.env.PROD || window.location.hostname !== 'localhost') {
    // Get the Cloud Function URL from environment or construct it
    // The function URL already includes the full path, so we use it directly
    const functionUrl = import.meta.env.VITE_FUNCTION_URL || 
      'https://us-central1-nextelite-89f47.cloudfunctions.net/api'
    // If VITE_FUNCTION_URL is set, use it as-is (should include /api)
    // Otherwise, use the default which already includes /api
    return functionUrl.endsWith('/api') ? functionUrl : `${functionUrl}/api`
  }
  // Development: use localhost
  return 'http://localhost:3001/api'
}

const API_BASE_URL = getApiBaseUrl()

// Helper to check if backend is available
async function checkBackendAvailable() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    })
    return response.ok
  } catch (error) {
    return false
  }
}

// Helper to handle fetch errors
function handleFetchError(error, operation) {
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    throw new Error(`Backend server is not running. Please start it with: npm run server`)
  }
  throw error
}

export const userService = {
  // Create user in both Firebase Auth and Firestore
  async createUser(email, password, name, role) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating user:', error)
      handleFetchError(error, 'create user')
      throw error
    }
  },

  // Change user password directly
  async changePassword(email, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }

      return await response.json()
    } catch (error) {
      console.error('Error changing password:', error)
      throw error
    }
  },

  // Disable/Enable user in Firebase Auth
  async setUserDisabled(email, disabled) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}/disabled`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ disabled }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user status')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating user status:', error)
      throw error
    }
  },

  // Delete user from Firebase Auth
  async deleteUser(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      return await response.json()
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  },

  // Get user login history
  async getLoginHistory(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}/login-history`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to get login history')
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting login history:', error)
      // Enhance error message for connection issues
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Failed to fetch - Backend server may not be running')
      }
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - Backend server may not be responding')
      }
      throw error
    }
  },

  // Record login (called from frontend when user logs in)
  async recordLogin(email, uid) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
      })

      if (!response.ok) {
        // Don't throw error for login tracking - it's not critical
        console.warn('Failed to record login:', await response.text())
        return null
      }

      return await response.json()
    } catch (error) {
      // Don't throw error for login tracking - backend might not be running
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.warn('Backend server not running - login not tracked')
      } else {
        console.warn('Error recording login:', error)
      }
      return null
    }
  },

  // Update user information (email, name, role)
  async updateUser(originalEmail, newEmail, name, role) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(originalEmail)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail, name, role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating user:', error)
      handleFetchError(error, 'update user')
      throw error
    }
  },

  // Check if backend is available
  checkBackendAvailable,
}

