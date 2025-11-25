# Console Logs Needed for Debugging User Login

Please add the following console logs to the login/authentication flow in the other portal to help debug user document lookup issues.

## Location: `src/App.jsx` - Around the user document lookup (lines 100-123)

### 1. Before Email Key Generation
```javascript
console.log('=== USER DOCUMENT LOOKUP START ===');
console.log('Original email from Firebase Auth:', user.email);
console.log('User UID:', user.uid);
```

### 2. Email Key Generation
```javascript
const emailKey = user.email.replace(/[@.]/g, '_');
console.log('Generated email key:', emailKey);
console.log('Email key generation breakdown:');
console.log('  - Original:', user.email);
console.log('  - After replace(@):', user.email.replace('@', '_'));
console.log('  - After replace(/[@.]/g):', emailKey);
console.log('  - Final key length:', emailKey.length);
```

### 3. Firestore Document Lookup - Email Key
```javascript
console.log('Attempting to fetch document: users/' + emailKey);
const userDoc = await getDoc(doc(db, 'users', emailKey));
console.log('Document exists?', userDoc.exists());
if (userDoc.exists()) {
  console.log('✅ Document found with email key');
  console.log('Document data:', userDoc.data());
  console.log('Document ID:', userDoc.id);
} else {
  console.log('❌ Document NOT found with email key:', emailKey);
}
```

### 4. Firestore Document Lookup - UID Fallback
```javascript
console.log('Attempting fallback lookup with UID: users/' + user.uid);
const userDocByUid = await getDoc(doc(db, 'users', user.uid));
console.log('UID document exists?', userDocByUid.exists());
if (userDocByUid.exists()) {
  console.log('✅ Document found with UID');
  console.log('Document data:', userDocByUid.data());
  console.log('Document ID:', userDocByUid.id);
} else {
  console.log('❌ Document NOT found with UID:', user.uid);
}
```

### 5. Collection Query (Optional - if you want to check all users)
```javascript
// Optional: List all user document IDs to see what exists
console.log('=== CHECKING ALL USER DOCUMENTS ===');
const usersSnapshot = await getDocs(collection(db, 'users'));
const allUserIds = [];
usersSnapshot.forEach((doc) => {
  allUserIds.push(doc.id);
  if (doc.id.includes('be') || doc.id.includes('ne') || doc.id.includes('ai')) {
    console.log('Found related document:', doc.id, '->', doc.data().email);
  }
});
console.log('Total user documents:', allUserIds.length);
console.log('All user document IDs:', allUserIds);
console.log('Looking for:', emailKey);
console.log('Match found?', allUserIds.includes(emailKey));
```

### 6. Error Handling
```javascript
catch (error) {
  console.error('=== FIRESTORE LOOKUP ERROR ===');
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Error details:', error);
  console.error('Email key used:', emailKey);
  console.error('UID used:', user.uid);
}
```

## Complete Example Code Block

Replace the user lookup section in `App.jsx` with:

```javascript
// Try to find user document by email (sanitized)
console.log('=== USER DOCUMENT LOOKUP START ===');
console.log('Original email from Firebase Auth:', user.email);
console.log('User UID:', user.uid);

const emailKey = user.email.replace(/[@.]/g, '_');
console.log('Generated email key:', emailKey);
console.log('Email key generation breakdown:');
console.log('  - Original:', user.email);
console.log('  - After replace(/[@.]/g):', emailKey);
console.log('  - Final key length:', emailKey.length);

console.log('Attempting to fetch document: users/' + emailKey);
try {
  const userDoc = await getDoc(doc(db, 'users', emailKey));
  console.log('Document exists?', userDoc.exists());
  
  if (userDoc.exists()) {
    const userData = { ...userDoc.data(), id: emailKey, uid: user.uid };
    console.log('✅ User data found with email key');
    console.log('Document data:', userData);
    console.log('Document ID:', userDoc.id);
    setCurrentUser(userData);
  } else {
    console.log('❌ User document not found in Firestore with key:', emailKey);
    
    // Try with UID as fallback
    console.log('Attempting fallback lookup with UID: users/' + user.uid);
    const userDocByUid = await getDoc(doc(db, 'users', user.uid));
    console.log('UID document exists?', userDocByUid.exists());
    
    if (userDocByUid.exists()) {
      const userData = { ...userDocByUid.data(), id: user.uid, uid: user.uid };
      console.log('✅ User data found by UID');
      console.log('Document data:', userData);
      setCurrentUser(userData);
    } else {
      console.error('❌ User document not found by email or UID');
      console.error('Email key searched:', emailKey);
      console.error('UID searched:', user.uid);
      
      // Optional: List all user documents for debugging
      console.log('=== CHECKING ALL USER DOCUMENTS ===');
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUserIds = [];
      usersSnapshot.forEach((doc) => {
        allUserIds.push(doc.id);
        const docEmail = doc.data().email;
        if (docEmail === user.email || doc.id === emailKey || doc.id === user.uid) {
          console.log('Found matching document:', doc.id, '-> Email:', docEmail);
        }
      });
      console.log('Total user documents:', allUserIds.length);
      console.log('All user document IDs:', allUserIds.slice(0, 20)); // First 20
      console.log('Looking for:', emailKey);
      console.log('Match found?', allUserIds.includes(emailKey));
      
      alert('User account not properly configured. Please contact administrator.');
      await signOut(auth);
    }
  }
} catch (error) {
  console.error('=== FIRESTORE LOOKUP ERROR ===');
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Email key used:', emailKey);
  console.error('UID used:', user.uid);
  console.error('Full error:', error);
  alert('Error loading user data: ' + error.message);
}
```

## What These Logs Will Tell Us

1. **Email Key Format**: Confirms exactly how the email key is being generated
2. **Document Existence**: Shows if the document exists or not
3. **Document Structure**: Shows what data is in the document if found
4. **All Documents**: Lists all user documents so we can see what actually exists
5. **Error Details**: Shows any Firestore errors that might occur

## Expected Output for `be@ne.ai`

When logging in with `be@ne.ai`, you should see:
```
=== USER DOCUMENT LOOKUP START ===
Original email from Firebase Auth: be@ne.ai
User UID: yy1ZQWPpuBcrx36kTsoxGA05Ns82
Generated email key: be_ne_ai
Email key generation breakdown:
  - Original: be@ne.ai
  - After replace(/[@.]/g): be_ne_ai
  - Final key length: 8
Attempting to fetch document: users/be_ne_ai
Document exists? false
❌ User document not found in Firestore with key: be_ne_ai
```

This will help us verify:
- The email key format matches what we're creating in the admin portal
- Whether the document actually exists in Firestore
- What documents DO exist that might be related

