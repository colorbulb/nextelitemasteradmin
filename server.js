// Backend server for user management using Firebase Admin SDK
import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Firebase Admin
// Try to use service account key first, then fall back to default credentials
let adminInitialized = false

try {
  const serviceAccountPath = path.join(__dirname, 'service-account-key.json')
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'nextelite-89f47'
  })
  console.log('✅ Firebase Admin initialized with service account')
  adminInitialized = true
} catch (error) {
  try {
    admin.initializeApp({
      projectId: 'nextelite-89f47'
    })
    console.log('✅ Firebase Admin initialized with default credentials')
    adminInitialized = true
  } catch (initError) {
    console.error('❌ Failed to initialize Firebase Admin:', initError.message)
    console.error('Please provide service-account-key.json or run: firebase login')
    process.exit(1)
  }
}

const db = admin.firestore()
const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Helper function to get Firestore instance
function getDb() {
  return db
}

// Helper to sanitize email for document ID
function sanitizeEmail(email) {
  return email.replace(/[@.]/g, '_')
}

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, name, role } = req.body

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name, role' })
    }

    // Validate role
    const validRoles = ['teacher', 'student', 'parent', 'assistant']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` })
    }

    // 1. Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
      displayName: name
    })

    console.log('✅ Firebase Auth user created:', userRecord.uid)
    
    // Set custom claims (role) for Storage/Firestore security rules
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role })
    console.log('✅ Set custom claims (role):', role)

    // 2. Create user document in Firestore
    const emailKey = sanitizeEmail(email)
    const db = getDb()

    const userData = {
      email: email,
      name: name,
      role: role,
      uid: userRecord.uid,
      disabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      loginHistory: []
    }

    // Create document with email key (primary)
    await db.collection('users').doc(emailKey).set(userData)
    console.log('✅ Created user document with email key:', emailKey)

    // Also create with UID as fallback
    await db.collection('users').doc(userRecord.uid).set(userData)
    console.log('✅ Created user document with UID:', userRecord.uid)

    // Create document in role-specific collection with full data
    const roleData = {
      name: name,
      email: email,
      role: role,
      uid: userRecord.uid,
      disabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (role === 'teacher') {
      // Create with emailKey as document ID
      await db.collection('teachers').doc(emailKey).set(roleData)
      console.log('✅ Created teacher document with email key:', emailKey)
      // Also create with UID as document ID (for compatibility)
      await db.collection('teachers').doc(userRecord.uid).set(roleData)
      console.log('✅ Created teacher document with UID:', userRecord.uid)
    } else if (role === 'student') {
      await db.collection('students').doc(emailKey).set(roleData)
      console.log('✅ Created student document:', emailKey)
      await db.collection('students').doc(userRecord.uid).set(roleData)
      console.log('✅ Created student document with UID:', userRecord.uid)
    } else if (role === 'parent') {
      await db.collection('parents').doc(emailKey).set(roleData)
      console.log('✅ Created parent document:', emailKey)
      await db.collection('parents').doc(userRecord.uid).set(roleData)
      console.log('✅ Created parent document with UID:', userRecord.uid)
    } else if (role === 'assistant') {
      await db.collection('assistants').doc(emailKey).set(roleData)
      console.log('✅ Created assistant document:', emailKey)
      await db.collection('assistants').doc(userRecord.uid).set(roleData)
      console.log('✅ Created assistant document with UID:', userRecord.uid)
    }

    res.json({
      success: true,
      uid: userRecord.uid,
      emailKey: emailKey,
      userData: userData
    })
  } catch (error) {
    console.error('❌ Error creating user:', error)
    res.status(500).json({ error: error.message })
  }
})

// Change password
app.patch('/api/users/:email/password', async (req, res) => {
  try {
    const { email } = req.params
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }

    const emailKey = sanitizeEmail(email)
    const db = getDb()
    const userDoc = await db.collection('users').doc(emailKey).get()

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userData = userDoc.data()
    if (!userData.uid) {
      return res.status(400).json({ error: 'User UID not found' })
    }

    // Update password in Firebase Auth
    await admin.auth().updateUser(userData.uid, {
      password: password
    })

    // Update Firestore
    await db.collection('users').doc(emailKey).update({
      updatedAt: new Date().toISOString()
    })

    if (userData.uid !== emailKey) {
      await db.collection('users').doc(userData.uid).update({
        updatedAt: new Date().toISOString()
      })
    }

    console.log('✅ Password updated for:', email)
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Error changing password:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update user information (email, name, role)
app.patch('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params
    const { email: newEmail, name, role } = req.body

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' })
    }

    if (!['student', 'teacher', 'parent', 'assistant'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: student, teacher, parent, or assistant' })
    }

    const emailKey = sanitizeEmail(email)
    const db = getDb()
    const userDoc = await db.collection('users').doc(emailKey).get()

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userData = userDoc.data()
    const updateData = {
      name,
      role,
      updatedAt: new Date().toISOString()
    }

    // If email is being changed, update it
    if (newEmail && newEmail !== email) {
      updateData.email = newEmail
      
      // If email changed, we need to create a new document with the new email key
      const newEmailKey = sanitizeEmail(newEmail)
      
      // Update Firebase Auth email if UID exists
      if (userData.uid) {
        await admin.auth().updateUser(userData.uid, {
          email: newEmail
        })
      }

      // Create new document with new email key
      await db.collection('users').doc(newEmailKey).set({
        ...userData,
        ...updateData
      })

      // Delete old document
      await db.collection('users').doc(emailKey).delete()

      // Also update UID document if it exists and is different
      if (userData.uid && userData.uid !== emailKey) {
        await db.collection('users').doc(userData.uid).update(updateData)
      }

      // Update role-specific collection
      const roleCollection = `${role}s`
      if (userData.role && userData.role !== role) {
        // Remove from old role collection
        const oldRoleCollection = `${userData.role}s`
        try {
          await db.collection(oldRoleCollection).doc(emailKey).delete()
        } catch (e) {
          // Ignore if doesn't exist
        }
      }
      // Add to new role collection
      await db.collection(roleCollection).doc(newEmailKey).set({
        ...userData,
        ...updateData
      })

      console.log(`✅ User updated (email changed): ${email} -> ${newEmail}`)
    } else {
      // Just update existing document
      await db.collection('users').doc(emailKey).update(updateData)

      // Also update UID document if it exists and is different
      if (userData.uid && userData.uid !== emailKey) {
        await db.collection('users').doc(userData.uid).update(updateData)
      }

      // Update role-specific collection
      const roleCollection = `${role}s`
      if (userData.role && userData.role !== role) {
        // Remove from old role collection
        const oldRoleCollection = `${userData.role}s`
        try {
          await db.collection(oldRoleCollection).doc(emailKey).delete()
        } catch (e) {
          // Ignore if doesn't exist
        }
      }
      // Update or create in new role collection
      await db.collection(roleCollection).doc(emailKey).set({
        ...userData,
        ...updateData
      }, { merge: true })

      console.log(`✅ User updated: ${email}`)
    }

    res.json({ success: true })
  } catch (error) {
    console.error('❌ Error updating user:', error)
    res.status(500).json({ error: error.message })
  }
})

// Disable/Enable user
app.patch('/api/users/:email/disabled', async (req, res) => {
  try {
    const { email } = req.params
    const { disabled } = req.body

    if (typeof disabled !== 'boolean') {
      return res.status(400).json({ error: 'disabled must be boolean' })
    }

    const emailKey = sanitizeEmail(email)
    const db = getDb()
    const userDoc = await db.collection('users').doc(emailKey).get()

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userData = userDoc.data()

    // Update Firebase Auth
    if (userData.uid) {
      await admin.auth().updateUser(userData.uid, {
        disabled: disabled
      })
    }

    // Update Firestore
    await db.collection('users').doc(emailKey).update({
      disabled: disabled,
      updatedAt: new Date().toISOString()
    })

    if (userData.uid && userData.uid !== emailKey) {
      await db.collection('users').doc(userData.uid).update({
        disabled: disabled,
        updatedAt: new Date().toISOString()
      })
    }

    console.log(`✅ User ${disabled ? 'disabled' : 'enabled'}:`, email)
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Error updating user status:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete user
app.delete('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params

    const emailKey = sanitizeEmail(email)
    const db = getDb()
    const userDoc = await db.collection('users').doc(emailKey).get()

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userData = userDoc.data()

    // Delete from Firebase Auth
    if (userData.uid) {
      await admin.auth().deleteUser(userData.uid)
    }

    // Delete from Firestore
    await db.collection('users').doc(emailKey).delete()
    if (userData.uid && userData.uid !== emailKey) {
      await db.collection('users').doc(userData.uid).delete()
    }

    console.log('✅ User deleted:', email)
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Error deleting user:', error)
    res.status(500).json({ error: error.message })
  }
})

// Record login
app.post('/api/users/:email/login', async (req, res) => {
  try {
    const { email } = req.params
    const { uid } = req.body

    const emailKey = sanitizeEmail(email)
    const db = getDb()
    const userDoc = await db.collection('users').doc(emailKey).get()

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' })
    }

    const now = new Date().toISOString()
    const loginEntry = {
      timestamp: now,
      uid: uid
    }

    // Get existing login history
    const userData = userDoc.data()
    const loginHistory = userData.loginHistory || []
    
    // Add new login (keep last 50 entries)
    loginHistory.unshift(loginEntry)
    if (loginHistory.length > 50) {
      loginHistory.pop()
    }

    // Update Firestore
    const updateData = {
      lastLogin: now,
      loginHistory: loginHistory,
      updatedAt: now
    }

    await db.collection('users').doc(emailKey).update(updateData)

    if (userData.uid && userData.uid !== emailKey) {
      await db.collection('users').doc(userData.uid).update(updateData)
    }

    res.json({ success: true, lastLogin: now })
  } catch (error) {
    console.error('❌ Error recording login:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get login history
app.get('/api/users/:email/login-history', async (req, res) => {
  try {
    const { email } = req.params

    const emailKey = sanitizeEmail(email)
    const db = getDb()
    const userDoc = await db.collection('users').doc(emailKey).get()

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userData = userDoc.data()
    res.json({
      lastLogin: userData.lastLogin || null,
      loginHistory: userData.loginHistory || []
    })
  } catch (error) {
    console.error('❌ Error getting login history:', error)
    res.status(500).json({ error: error.message })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nextelite-backend' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
  console.log(`API endpoints available at http://localhost:${PORT}/api/users`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})

