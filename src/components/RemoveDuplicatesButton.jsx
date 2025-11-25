import { useState } from 'react'
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import './RemoveDuplicatesButton.css'

function RemoveDuplicatesButton({ onComplete }) {
  const [removing, setRemoving] = useState(false)
  const [status, setStatus] = useState('')

  const handleRemoveDuplicates = async () => {
    if (!window.confirm('This will find and remove duplicate user documents. Documents with email keys (e.g., user_example_com) will be kept, and UID-based duplicates will be removed. Continue?')) {
      return
    }

    setRemoving(true)
    setStatus('Scanning for duplicates...')

    try {
      console.log('=== SCANNING FOR DUPLICATE USER DOCUMENTS ===')
      
      const usersRef = collection(db, 'users')
      const querySnapshot = await getDocs(usersRef)
      
      // Group documents by email
      const emailGroups = new Map()
      const allDocs = []
      
      querySnapshot.forEach((docSnapshot) => {
        const docData = docSnapshot.data()
        const email = docData.email
        const docId = docSnapshot.id
        
        allDocs.push({
          id: docId,
          data: docData,
          email: email
        })
        
        if (email) {
          if (!emailGroups.has(email)) {
            emailGroups.set(email, [])
          }
          emailGroups.get(email).push({
            id: docId,
            data: docData
          })
        }
      })
      
      console.log(`Total documents: ${allDocs.length}`)
      console.log(`Unique emails: ${emailGroups.size}`)
      
      // Find duplicates
      const duplicates = []
      const toDelete = []
      
      emailGroups.forEach((docs, email) => {
        if (docs.length > 1) {
          console.log(`\nFound ${docs.length} documents for email: ${email}`)
          docs.forEach(d => console.log(`  - Document ID: ${d.id}`))
          
          // Generate expected email key
          const emailKey = email.replace(/[@.]/g, '_')
          
          // Find which document has the email key
          const emailKeyDoc = docs.find(d => d.id === emailKey)
          const uidDocs = docs.filter(d => d.id !== emailKey)
          
          if (emailKeyDoc) {
            console.log(`  ✅ Keeping email key document: ${emailKeyDoc.id}`)
            // Mark UID-based documents for deletion
            uidDocs.forEach(uidDoc => {
              console.log(`  ❌ Marking for deletion: ${uidDoc.id} (UID-based duplicate)`)
              toDelete.push({
                email: email,
                docId: uidDoc.id,
                reason: 'UID-based duplicate, email key document exists'
              })
            })
          } else {
            // No email key document found - keep the first one, delete others
            console.log(`  ⚠️ No email key document found, keeping first: ${docs[0].id}`)
            docs.slice(1).forEach(duplicateDoc => {
              console.log(`  ❌ Marking for deletion: ${duplicateDoc.id}`)
              toDelete.push({
                email: email,
                docId: duplicateDoc.id,
                reason: 'Duplicate, no email key document found'
              })
            })
          }
          
          duplicates.push({
            email: email,
            total: docs.length,
            keeping: emailKeyDoc ? emailKeyDoc.id : docs[0].id,
            deleting: uidDocs.map(d => d.id)
          })
        }
      })
      
      // Also find documents without emails that might be duplicates
      const noEmailDocs = allDocs.filter(d => !d.email)
      if (noEmailDocs.length > 0) {
        console.log(`\nFound ${noEmailDocs.length} documents without email addresses`)
        noEmailDocs.forEach(d => {
          console.log(`  - Document ID: ${d.id}`)
        })
      }
      
      console.log(`\n=== DUPLICATE SUMMARY ===`)
      console.log(`Total duplicates found: ${duplicates.length}`)
      console.log(`Documents to delete: ${toDelete.length}`)
      
      if (toDelete.length === 0) {
        setStatus('No duplicates found!')
        setRemoving(false)
        return
      }
      
      // Show summary
      const summary = `Found ${duplicates.length} emails with duplicates.\n${toDelete.length} documents will be deleted.\n\nContinue?`
      if (!window.confirm(summary)) {
        setStatus('Cancelled')
        setRemoving(false)
        return
      }
      
      // Delete duplicates
      setStatus(`Deleting ${toDelete.length} duplicate documents...`)
      let deleted = 0
      let errors = 0
      
      for (const item of toDelete) {
        try {
          console.log(`Deleting: users/${item.docId} (${item.reason})`)
          await deleteDoc(doc(db, 'users', item.docId))
          deleted++
          setStatus(`Deleted ${deleted}/${toDelete.length}...`)
        } catch (error) {
          console.error(`Error deleting ${item.docId}:`, error)
          errors++
        }
      }
      
      console.log(`\n=== DELETION COMPLETE ===`)
      console.log(`Deleted: ${deleted}`)
      console.log(`Errors: ${errors}`)
      
      setStatus(`Complete! Deleted ${deleted} duplicate documents. ${errors > 0 ? `(${errors} errors)` : ''}`)
      
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('=== REMOVE DUPLICATES ERROR ===')
      console.error('Error:', error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="remove-duplicates-container">
      <button
        onClick={handleRemoveDuplicates}
        disabled={removing}
        className="remove-duplicates-button"
      >
        {removing ? 'Removing Duplicates...' : 'Remove Duplicate Documents'}
      </button>
      {status && (
        <div className={`remove-duplicates-status ${removing ? 'removing' : ''}`}>
          {status}
        </div>
      )}
    </div>
  )
}

export default RemoveDuplicatesButton

