import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc,
  addDoc,
  where,
  setDoc
} from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebase/config'
import { userService } from '../services/userService'
import UserList from './UserList'
import AddUserModal from './AddUserModal'
import EditUserModal from './EditUserModal'
import MigrateUsersButton from './MigrateUsersButton'
import CreateMissingDocumentsButton from './CreateMissingDocumentsButton'
import RemoveDuplicatesButton from './RemoveDuplicatesButton'
import CleanupRoleCollectionsButton from './CleanupRoleCollectionsButton'
import './Dashboard.css'

function Dashboard({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [activeRoleTab, setActiveRoleTab] = useState('all') // New state for role tabs
  const [showLoginHistory, setShowLoginHistory] = useState(false)
  const [loginHistoryData, setLoginHistoryData] = useState(null)
  const [loginHistoryEmail, setLoginHistoryEmail] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersRef = collection(db, 'users')
      const q = query(usersRef)
      const querySnapshot = await getDocs(q)
      
      // Use a Map to deduplicate users by email (since we may have both UID and email-key documents)
      const usersMap = new Map()
      
      querySnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() }
        const email = userData.email
        
        if (email) {
          // Use email as the key to deduplicate
          // Prefer email-key documents over UID-key documents
          // Format: user@example.com -> user_example_com
          const emailKey = email.replace(/[@.]/g, '_')
          if (!usersMap.has(email) || doc.id === emailKey) {
            usersMap.set(email, userData)
          }
        } else {
          // If no email, use document ID
          usersMap.set(doc.id, userData)
        }
      })
      
      setUsers(Array.from(usersMap.values()))
    } catch (error) {
      console.error('Error loading users:', error)
      alert('Failed to load users: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleDisableUser = async (userEmail, currentDisabled) => {
    if (!window.confirm(`Are you sure you want to ${!currentDisabled ? 'disable' : 'enable'} ${userEmail}?`)) {
      return
    }

    try {
      const newDisabledValue = !currentDisabled
      await userService.setUserDisabled(userEmail, newDisabledValue)
      await loadUsers()
      alert(`User ${!currentDisabled ? 'disabled' : 'enabled'} successfully`)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user: ' + error.message)
    }
  }

  const handleChangePassword = async (userEmail) => {
    const newPassword = window.prompt(`Enter new password for ${userEmail}:`)
    if (!newPassword) {
      return
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    if (!window.confirm(`Change password for ${userEmail}?`)) {
      return
    }

    try {
      await userService.changePassword(userEmail, newPassword)
      alert('Password changed successfully')
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password: ' + error.message)
    }
  }

  const handleDeleteUser = async (userEmail) => {
    if (!window.confirm(`⚠️ WARNING: This will permanently delete ${userEmail} from Firebase Authentication and Firestore.\n\nThis action cannot be undone!\n\nAre you sure?`)) {
      return
    }

    try {
      await userService.deleteUser(userEmail)
      await loadUsers()
      alert('User deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user: ' + error.message)
    }
  }

  const handleViewLoginHistory = async (userEmail) => {
    try {
      const history = await userService.getLoginHistory(userEmail)
      setLoginHistoryData(history)
      setLoginHistoryEmail(userEmail)
      setShowLoginHistory(true)
    } catch (error) {
      console.error('Error getting login history:', error)
      
      // Check for connection errors (backend not running)
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        if (isLocalhost) {
          alert(`Backend server is not running!\n\nTo fix:\n1. Open a terminal\n2. Run: cd nextelitebackend && npm run server\n3. Keep it running\n4. Try again`)
        } else {
          alert(`Cannot connect to backend server.\n\nIf you're in production, make sure Cloud Functions are deployed.\n\nError: ${error.message}`)
        }
        return
      }
      
      // Check if it's a 404 (user not found) or other error
      if (error.message.includes('not found') || error.message.includes('404')) {
        alert(`User document not found for ${userEmail}.\n\nPlease use "🔧 Fix Doc" button to create the Firestore document first.`)
      } else {
        alert(`Failed to get login history: ${error.message}`)
      }
    }
  }

  const handleResetPassword = async (userEmail) => {
    if (!window.confirm(`Send password reset email to ${userEmail}?`)) {
      return
    }

    try {
      await sendPasswordResetEmail(auth, userEmail)
      alert('Password reset email sent successfully')
    } catch (error) {
      console.error('Error sending password reset:', error)
      alert('Failed to send password reset email: ' + error.message)
    }
  }

  const handleFixUserDocument = async (userEmail, userId, userData) => {
    if (!window.confirm(`Create/fix Firestore document for ${userEmail}?`)) {
      return
    }

    try {
      console.log('=== FIXING USER DOCUMENT ===')
      console.log('Email:', userEmail)
      console.log('User ID:', userId)
      console.log('Existing user data:', userData)

      // Generate email key
      const emailKey = userEmail.replace(/[@.]/g, '_')
      console.log('Email key:', emailKey)

      // Prepare user data - use existing data or create minimal structure
      const fixedUserData = {
        email: userEmail,
        name: userData?.name || 'Unknown',
        role: userData?.role || 'student',
        uid: userData?.uid || userId,
        disabled: userData?.disabled || false,
      }

      // Add role-specific fields if needed
      if (fixedUserData.role === 'parent') {
        fixedUserData.phone = userData?.phone || ''
        fixedUserData.childEmails = userData?.childEmails || []
        fixedUserData.childIds = userData?.childIds || []
      }

      if (fixedUserData.role === 'student') {
        fixedUserData.classIds = userData?.classIds || []
        fixedUserData.parentId = userData?.parentId || ''
      }

      console.log('Creating document with data:', fixedUserData)

      // Create document with email key
      await setDoc(doc(db, 'users', emailKey), fixedUserData)
      console.log(`✅ Created document: users/${emailKey}`)

      // Also create with UID if different
      if (fixedUserData.uid && fixedUserData.uid !== emailKey) {
        await setDoc(doc(db, 'users', fixedUserData.uid), fixedUserData)
        console.log(`✅ Created document: users/${fixedUserData.uid}`)
      }

      // Also add to role-specific collection
      if (fixedUserData.role === 'student') {
        await setDoc(doc(db, 'students', emailKey), fixedUserData)
        console.log(`✅ Created document: students/${emailKey}`)
      } else if (fixedUserData.role === 'parent') {
        await setDoc(doc(db, 'parents', emailKey), fixedUserData)
        console.log(`✅ Created document: parents/${emailKey}`)
      } else if (fixedUserData.role === 'teacher') {
        await setDoc(doc(db, 'teachers', emailKey), fixedUserData)
        console.log(`✅ Created document: teachers/${emailKey}`)
      } else if (fixedUserData.role === 'assistant') {
        await setDoc(doc(db, 'assistants', emailKey), fixedUserData)
        console.log(`✅ Created document: assistants/${emailKey}`)
      }

      console.log('=== DOCUMENT FIX COMPLETE ===')
      alert(`User document created successfully with key: ${emailKey}`)
      await loadUsers()
    } catch (error) {
      console.error('Error fixing user document:', error)
      alert('Failed to fix user document: ' + error.message)
    }
  }

  const handleUserAdded = () => {
    setShowAddModal(false)
    loadUsers()
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleUserUpdated = () => {
    setShowEditModal(false)
    setEditingUser(null)
    loadUsers()
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.uid?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Use activeRoleTab instead of filterRole for tab-based filtering
    const matchesRole = activeRoleTab === 'all' || user.role === activeRoleTab
    
    return matchesSearch && matchesRole
  })

  // Count users by role for tab badges
  const roleCounts = {
    all: users.length,
    teacher: users.filter(u => u.role === 'teacher').length,
    assistant: users.filter(u => u.role === 'assistant').length,
    student: users.filter(u => u.role === 'student').length,
    parent: users.filter(u => u.role === 'parent').length,
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>NextElite Admin Portal</h1>
          <p className="user-info">Logged in as: {user.email}</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        <div className="admin-actions">
          <MigrateUsersButton onMigrationComplete={loadUsers} />
          <CreateMissingDocumentsButton onComplete={loadUsers} />
          <RemoveDuplicatesButton onComplete={loadUsers} />
          <CleanupRoleCollectionsButton onComplete={loadUsers} />
        </div>
        
        {/* Role Tabs */}
        <div className="role-tabs-container">
          <button
            onClick={() => setActiveRoleTab('all')}
            className={`role-tab ${activeRoleTab === 'all' ? 'active' : ''}`}
          >
            All <span className="role-count">({roleCounts.all})</span>
          </button>
          <button
            onClick={() => setActiveRoleTab('teacher')}
            className={`role-tab ${activeRoleTab === 'teacher' ? 'active' : ''}`}
          >
            Teachers <span className="role-count">({roleCounts.teacher})</span>
          </button>
          <button
            onClick={() => setActiveRoleTab('assistant')}
            className={`role-tab ${activeRoleTab === 'assistant' ? 'active' : ''}`}
          >
            Assistants <span className="role-count">({roleCounts.assistant})</span>
          </button>
          <button
            onClick={() => setActiveRoleTab('student')}
            className={`role-tab ${activeRoleTab === 'student' ? 'active' : ''}`}
          >
            Students <span className="role-count">({roleCounts.student})</span>
          </button>
          <button
            onClick={() => setActiveRoleTab('parent')}
            className={`role-tab ${activeRoleTab === 'parent' ? 'active' : ''}`}
          >
            Parents <span className="role-count">({roleCounts.parent})</span>
          </button>
        </div>

        <div className="dashboard-toolbar">
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search by email, name, or UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="add-user-button"
          >
            + Add User
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <UserList
            users={filteredUsers}
            onDisable={handleDisableUser}
            onResetPassword={handleResetPassword}
            onFixDocument={handleFixUserDocument}
            onChangePassword={handleChangePassword}
            onDelete={handleDeleteUser}
            onViewLoginHistory={handleViewLoginHistory}
            onEdit={handleEditUser}
          />
        )}
      </div>

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onUserAdded={handleUserAdded}
        />
      )}

      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setShowEditModal(false)
            setEditingUser(null)
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {showLoginHistory && (
        <div className="modal-overlay" onClick={() => setShowLoginHistory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>Login History: {loginHistoryEmail}</h2>
              <button className="close-button" onClick={() => setShowLoginHistory(false)}>×</button>
            </div>
            <div className="login-history-content">
              {loginHistoryData && (
                <>
                  <div className="last-login-info">
                    <strong>Last Login:</strong>{' '}
                    {loginHistoryData.lastLogin 
                      ? new Date(loginHistoryData.lastLogin).toLocaleString()
                      : 'Never'}
                  </div>
                  <div className="login-history-list">
                    <h3>Recent Logins ({loginHistoryData.loginHistory?.length || 0})</h3>
                    {loginHistoryData.loginHistory && loginHistoryData.loginHistory.length > 0 ? (
                      <table className="history-table">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>UID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginHistoryData.loginHistory.map((entry, index) => (
                            <tr key={index}>
                              <td>{new Date(entry.timestamp).toLocaleString()}</td>
                              <td className="uid-cell">{entry.uid}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>No login history available</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

