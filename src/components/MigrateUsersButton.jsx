import { useState } from 'react'
import { collection, query, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import './MigrateUsersButton.css'

function MigrateUsersButton({ onMigrationComplete }) {
  const [migrating, setMigrating] = useState(false)
  const [status, setStatus] = useState('')

  const handleMigrate = async () => {
    if (!window.confirm('This will create email-key documents for all existing users. Continue?')) {
      return
    }

    console.log('=== STARTING USER MIGRATION ===')
    setMigrating(true)
    setStatus('Starting migration...')

    try {
      console.log('Step 1: Loading all users from Firestore...')
      const usersRef = collection(db, 'users')
      const querySnapshot = await getDocs(usersRef)
      console.log(`  ✅ Found ${querySnapshot.docs.length} user documents`)
      
      let migrated = 0
      let skipped = 0
      let errors = 0

      for (const docSnapshot of querySnapshot.docs) {
        const userData = docSnapshot.data()
        const email = userData.email
        const docId = docSnapshot.id

        console.log(`\nProcessing document: ${docId}`)
        console.log('  - Email:', email)
        console.log('  - Role:', userData.role)

        if (!email) {
          console.log('  ⚠️ Skipping: No email found')
          skipped++
          continue
        }

        // Create email key (replace @ and . with _)
        // Format: user@example.com -> user_example_com
        const emailKey = email.replace(/[@.]/g, '_')
        console.log('  - Email key:', emailKey)

        // Skip if document already exists with email key
        if (docId === emailKey) {
          console.log('  ⏭️ Skipping: Document already uses email key format')
          skipped++
          continue
        }

        try {
          console.log(`  - Creating document: users/${emailKey}`)
          // Create document with email key
          await setDoc(doc(db, 'users', emailKey), userData)
          console.log('  ✅ Created users document with email key')
          migrated++

          // Also update role-specific collections
          if (userData.role === 'student') {
            console.log(`  - Creating document: students/${emailKey}`)
            await setDoc(doc(db, 'students', emailKey), userData)
            console.log('  ✅ Created students document')
          } else if (userData.role === 'parent') {
            console.log(`  - Creating document: parents/${emailKey}`)
            await setDoc(doc(db, 'parents', emailKey), userData)
            console.log('  ✅ Created parents document')
          } else if (userData.role === 'teacher') {
            console.log(`  - Creating document: teachers/${emailKey}`)
            await setDoc(doc(db, 'teachers', emailKey), userData)
            console.log('  ✅ Created teachers document')
          } else if (userData.role === 'assistant') {
            console.log(`  - Creating document: assistants/${emailKey}`)
            await setDoc(doc(db, 'assistants', emailKey), userData)
            console.log('  ✅ Created assistants document')
          }

          setStatus(`Migrated ${migrated} users...`)
        } catch (error) {
          console.error(`  ❌ Error migrating user ${email}:`, error)
          console.error('    Error code:', error.code)
          console.error('    Error message:', error.message)
          errors++
        }
      }

      console.log('\n=== MIGRATION COMPLETE ===')
      console.log(`Summary:`)
      console.log(`  - Migrated: ${migrated}`)
      console.log(`  - Skipped: ${skipped}`)
      console.log(`  - Errors: ${errors}`)

      setStatus(`Migration complete! Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`)
      
      if (onMigrationComplete) {
        onMigrationComplete()
      }
    } catch (error) {
      console.error('=== MIGRATION ERROR ===')
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Full error:', error)
      setStatus(`Migration failed: ${error.message}`)
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="migrate-users-container">
      <button
        onClick={handleMigrate}
        disabled={migrating}
        className="migrate-button"
      >
        {migrating ? 'Migrating...' : 'Migrate Existing Users'}
      </button>
      {status && (
        <div className={`migrate-status ${migrating ? 'migrating' : ''}`}>
          {status}
        </div>
      )}
    </div>
  )
}

export default MigrateUsersButton

