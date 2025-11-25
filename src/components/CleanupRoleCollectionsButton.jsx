import { useState } from 'react'
import { collection, getDocs, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import './CleanupRoleCollectionsButton.css'

function CleanupRoleCollectionsButton({ onComplete }) {
  const [cleaning, setCleaning] = useState(false)
  const [status, setStatus] = useState('')

  const handleCleanup = async () => {
    if (!window.confirm('This will clean up role-specific collections:\n- Remove non-teachers from teachers collection\n- Remove non-students from students collection\n- Remove non-parents from parents collection\n- Remove non-assistants from assistants collection\n\nContinue?')) {
      return
    }

    setCleaning(true)
    setStatus('Cleaning up role collections...')

    try {
      console.log('=== CLEANING UP ROLE COLLECTIONS ===')
      
      const results = {
        teachers: { removed: 0, kept: 0 },
        students: { removed: 0, kept: 0 },
        parents: { removed: 0, kept: 0 },
        assistants: { removed: 0, kept: 0 },
      }

      // Clean up teachers collection
      console.log('\n--- Cleaning teachers collection ---')
      const teachersRef = collection(db, 'teachers')
      const teachersSnapshot = await getDocs(teachersRef)
      
      for (const docSnapshot of teachersSnapshot.docs) {
        const docData = docSnapshot.data()
        const email = docData.email
        const role = docData.role
        
        if (role !== 'teacher') {
          console.log(`  ❌ Removing non-teacher from teachers collection: ${email} (role: ${role})`)
          await deleteDoc(doc(db, 'teachers', docSnapshot.id))
          results.teachers.removed++
        } else {
          console.log(`  ✅ Keeping teacher: ${email}`)
          results.teachers.kept++
        }
      }

      // Clean up students collection
      console.log('\n--- Cleaning students collection ---')
      const studentsRef = collection(db, 'students')
      const studentsSnapshot = await getDocs(studentsRef)
      
      for (const docSnapshot of studentsSnapshot.docs) {
        const docData = docSnapshot.data()
        const email = docData.email
        const role = docData.role
        
        if (role !== 'student') {
          console.log(`  ❌ Removing non-student from students collection: ${email} (role: ${role})`)
          await deleteDoc(doc(db, 'students', docSnapshot.id))
          results.students.removed++
        } else {
          console.log(`  ✅ Keeping student: ${email}`)
          results.students.kept++
        }
      }

      // Clean up parents collection
      console.log('\n--- Cleaning parents collection ---')
      const parentsRef = collection(db, 'parents')
      const parentsSnapshot = await getDocs(parentsRef)
      
      for (const docSnapshot of parentsSnapshot.docs) {
        const docData = docSnapshot.data()
        const email = docData.email
        const role = docData.role
        
        if (role !== 'parent') {
          console.log(`  ❌ Removing non-parent from parents collection: ${email} (role: ${role})`)
          await deleteDoc(doc(db, 'parents', docSnapshot.id))
          results.parents.removed++
        } else {
          console.log(`  ✅ Keeping parent: ${email}`)
          results.parents.kept++
        }
      }

      // Clean up assistants collection
      console.log('\n--- Cleaning assistants collection ---')
      const assistantsRef = collection(db, 'assistants')
      const assistantsSnapshot = await getDocs(assistantsRef)
      
      for (const docSnapshot of assistantsSnapshot.docs) {
        const docData = docSnapshot.data()
        const email = docData.email
        const role = docData.role
        
        if (role !== 'assistant') {
          console.log(`  ❌ Removing non-assistant from assistants collection: ${email} (role: ${role})`)
          await deleteDoc(doc(db, 'assistants', docSnapshot.id))
          results.assistants.removed++
        } else {
          console.log(`  ✅ Keeping assistant: ${email}`)
          results.assistants.kept++
        }
      }

      // Now ensure all users with correct roles are in their role collections
      console.log('\n--- Ensuring users are in correct role collections ---')
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      let added = 0
      for (const docSnapshot of usersSnapshot.docs) {
        const userData = docSnapshot.data()
        const email = userData.email
        const role = userData.role
        
        if (!email || !role) continue
        
        const emailKey = email.replace(/[@.]/g, '_')
        
        // Check if user is in correct role collection
        let needsAdd = false
        if (role === 'teacher') {
          const teacherDoc = await getDoc(doc(db, 'teachers', emailKey))
          if (!teacherDoc.exists()) {
            needsAdd = true
            await setDoc(doc(db, 'teachers', emailKey), userData)
            console.log(`  ✅ Added teacher to teachers collection: ${email}`)
            added++
          }
        } else if (role === 'student') {
          const studentDoc = await getDoc(doc(db, 'students', emailKey))
          if (!studentDoc.exists()) {
            needsAdd = true
            await setDoc(doc(db, 'students', emailKey), userData)
            console.log(`  ✅ Added student to students collection: ${email}`)
            added++
          }
        } else if (role === 'parent') {
          const parentDoc = await getDoc(doc(db, 'parents', emailKey))
          if (!parentDoc.exists()) {
            needsAdd = true
            await setDoc(doc(db, 'parents', emailKey), userData)
            console.log(`  ✅ Added parent to parents collection: ${email}`)
            added++
          }
        } else if (role === 'assistant') {
          const assistantDoc = await getDoc(doc(db, 'assistants', emailKey))
          if (!assistantDoc.exists()) {
            needsAdd = true
            await setDoc(doc(db, 'assistants', emailKey), userData)
            console.log(`  ✅ Added assistant to assistants collection: ${email}`)
            added++
          }
        }
      }

      console.log('\n=== CLEANUP COMPLETE ===')
      console.log('Summary:')
      console.log(`  Teachers: ${results.teachers.kept} kept, ${results.teachers.removed} removed`)
      console.log(`  Students: ${results.students.kept} kept, ${results.students.removed} removed`)
      console.log(`  Parents: ${results.parents.kept} kept, ${results.parents.removed} removed`)
      console.log(`  Assistants: ${results.assistants.kept} kept, ${results.assistants.removed} removed`)
      console.log(`  Added to role collections: ${added}`)

      const totalRemoved = results.teachers.removed + results.students.removed + results.parents.removed + results.assistants.removed
      setStatus(`Complete! Removed ${totalRemoved} incorrect documents, added ${added} missing documents.`)
      
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('=== CLEANUP ERROR ===')
      console.error('Error:', error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="cleanup-role-container">
      <button
        onClick={handleCleanup}
        disabled={cleaning}
        className="cleanup-role-button"
      >
        {cleaning ? 'Cleaning...' : 'Cleanup Role Collections'}
      </button>
      {status && (
        <div className={`cleanup-role-status ${cleaning ? 'cleaning' : ''}`}>
          {status}
        </div>
      )}
    </div>
  )
}

export default CleanupRoleCollectionsButton

