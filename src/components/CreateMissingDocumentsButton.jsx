import { useState } from 'react'
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import './CreateMissingDocumentsButton.css'

function CreateMissingDocumentsButton({ onComplete }) {
  const [creating, setCreating] = useState(false)
  const [status, setStatus] = useState('')

  const handleCreateMissing = async () => {
    if (!window.confirm('This will create Firestore documents for users that exist in Firebase Auth but not in Firestore. This requires Firebase Admin SDK. Continue with manual entry?')) {
      return
    }

    const email = prompt('Enter the email of the user to create a document for:')
    if (!email) return

    const name = prompt('Enter the user\'s name:') || 'Unknown'
    const role = prompt('Enter the user\'s role (student/teacher/parent/assistant):') || 'student'
    
    if (!['student', 'teacher', 'parent', 'assistant'].includes(role)) {
      alert('Invalid role. Must be: student, teacher, parent, or assistant')
      return
    }

    setCreating(true)
    setStatus('Creating document...')

    try {
      console.log('=== CREATING MISSING USER DOCUMENT ===')
      console.log('Email:', email)
      console.log('Name:', name)
      console.log('Role:', role)

      // Generate email key
      const emailKey = email.replace(/[@.]/g, '_')
      console.log('Email key:', emailKey)

      // Check if document already exists
      const existingDoc = await getDoc(doc(db, 'users', emailKey))
      if (existingDoc.exists()) {
        alert(`Document already exists for ${email} with key: ${emailKey}`)
        setStatus('Document already exists')
        setCreating(false)
        return
      }

      // Create user data
      const userData = {
        email: email,
        name: name,
        role: role,
        disabled: false,
      }

      // Add role-specific fields
      if (role === 'parent') {
        userData.phone = ''
        userData.childEmails = []
        userData.childIds = []
      }

      if (role === 'student') {
        userData.classIds = []
        userData.parentId = ''
      }

      console.log('Creating document with data:', userData)

      // Create document with email key
      await setDoc(doc(db, 'users', emailKey), userData)
      console.log(`✅ Created document: users/${emailKey}`)

      // Also add to role-specific collection
      if (role === 'student') {
        await setDoc(doc(db, 'students', emailKey), userData)
        console.log(`✅ Created document: students/${emailKey}`)
      } else if (role === 'parent') {
        await setDoc(doc(db, 'parents', emailKey), userData)
        console.log(`✅ Created document: parents/${emailKey}`)
      } else if (role === 'teacher') {
        await setDoc(doc(db, 'teachers', emailKey), userData)
        console.log(`✅ Created document: teachers/${emailKey}`)
      } else if (role === 'assistant') {
        await setDoc(doc(db, 'assistants', emailKey), userData)
        console.log(`✅ Created document: assistants/${emailKey}`)
      }

      console.log('=== DOCUMENT CREATION COMPLETE ===')
      setStatus(`Document created successfully for ${email} with key: ${emailKey}`)
      
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Error creating document:', error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="create-missing-container">
      <button
        onClick={handleCreateMissing}
        disabled={creating}
        className="create-missing-button"
      >
        {creating ? 'Creating...' : 'Create Missing Document'}
      </button>
      {status && (
        <div className={`create-missing-status ${creating ? 'creating' : ''}`}>
          {status}
        </div>
      )}
    </div>
  )
}

export default CreateMissingDocumentsButton

