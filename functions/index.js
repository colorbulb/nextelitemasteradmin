// Firebase Cloud Functions for user management (1st Generation)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Helper to sanitize email for document ID
function sanitizeEmail(email) {
  return email.replace(/[@.]/g, '_');
}

// Helper function to record login (reusable)
async function recordUserLogin(email, uid) {
  try {
    const emailKey = sanitizeEmail(email);
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(emailKey).get();

    // If email key doesn't exist, try UID
    if (!userDoc.exists && uid) {
      const uidDoc = await db.collection('users').doc(uid).get();
      if (uidDoc.exists) {
        const userData = uidDoc.data();
        if (userData.email) {
          // Use the email from the document
          return await recordUserLogin(userData.email, uid);
        }
      }
    }

    if (!userDoc.exists) {
      console.warn('⚠️ User document not found for login tracking:', email);
      return null;
    }

    const now = new Date().toISOString();
    const loginEntry = {
      timestamp: now,
      uid: uid
    };

    // Get existing login history
    const userData = userDoc.data();
    const loginHistory = userData.loginHistory || [];
    
    // Add new login (keep last 50 entries)
    loginHistory.unshift(loginEntry);
    if (loginHistory.length > 50) {
      loginHistory.pop();
    }

    // Update Firestore
    const updateData = {
      lastLogin: now,
      loginHistory: loginHistory,
      updatedAt: now
    };

    await db.collection('users').doc(emailKey).update(updateData);

    if (userData.uid && userData.uid !== emailKey) {
      await db.collection('users').doc(userData.uid).update(updateData);
    }

    console.log('✅ Login recorded for:', email);
    return { success: true, lastLogin: now };
  } catch (error) {
    console.error('❌ Error recording login:', error);
    return null;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nextelite-backend', timestamp: new Date().toISOString() });
});

// Create user
app.post('/users', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name, role' });
    }

    // Validate role
    const validRoles = ['teacher', 'student', 'parent', 'assistant'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // 1. Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
      displayName: name
    });

    console.log('✅ Firebase Auth user created:', userRecord.uid);
    
    // Set custom claims (role) for Storage/Firestore security rules
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });
    console.log('✅ Set custom claims (role):', role);

    // 2. Create user document in Firestore
    const emailKey = sanitizeEmail(email);
    const db = admin.firestore();

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
    };

    // Add role-specific fields to userData
    if (role === 'parent') {
      userData.phone = '';
      userData.childEmails = [];
      userData.childIds = [];
    } else if (role === 'student') {
      userData.classIds = [];
      userData.parentId = '';
    }

    // Create document with email key (primary)
    await db.collection('users').doc(emailKey).set(userData);
    console.log('✅ Created user document with email key:', emailKey);

    // Also create with UID as fallback
    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('✅ Created user document with UID:', userRecord.uid);

    // Create document in role-specific collection with full data
    const roleData = {
      name: name,
      email: email,
      role: role,
      uid: userRecord.uid,
      disabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add role-specific fields
    if (role === 'parent') {
      roleData.phone = '';
      roleData.childEmails = [];
      roleData.childIds = [];
    } else if (role === 'student') {
      roleData.classIds = [];
      roleData.parentId = '';
    }

    if (role === 'teacher') {
      // Create with emailKey as document ID
      await db.collection('teachers').doc(emailKey).set(roleData);
      console.log('✅ Created teacher document with email key:', emailKey);
      // Also create with UID as document ID (for compatibility)
      await db.collection('teachers').doc(userRecord.uid).set(roleData);
      console.log('✅ Created teacher document with UID:', userRecord.uid);
    } else if (role === 'student') {
      await db.collection('students').doc(emailKey).set(roleData);
      console.log('✅ Created student document:', emailKey);
      await db.collection('students').doc(userRecord.uid).set(roleData);
      console.log('✅ Created student document with UID:', userRecord.uid);
    } else if (role === 'parent') {
      await db.collection('parents').doc(emailKey).set(roleData);
      console.log('✅ Created parent document:', emailKey);
      await db.collection('parents').doc(userRecord.uid).set(roleData);
      console.log('✅ Created parent document with UID:', userRecord.uid);
    } else if (role === 'assistant') {
      await db.collection('assistants').doc(emailKey).set(roleData);
      console.log('✅ Created assistant document:', emailKey);
      await db.collection('assistants').doc(userRecord.uid).set(roleData);
      console.log('✅ Created assistant document with UID:', userRecord.uid);
    }

    res.json({
      success: true,
      uid: userRecord.uid,
      emailKey: emailKey,
      userData: userData
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Change password
app.patch('/users/:email/password', async (req, res) => {
  try {
    const { email } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const emailKey = sanitizeEmail(email);
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(emailKey).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (!userData.uid) {
      return res.status(400).json({ error: 'User UID not found' });
    }

    // Update password in Firebase Auth
    await admin.auth().updateUser(userData.uid, {
      password: password
    });

    // Update Firestore
    await db.collection('users').doc(emailKey).update({
      updatedAt: new Date().toISOString()
    });

    if (userData.uid !== emailKey) {
      await db.collection('users').doc(userData.uid).update({
        updatedAt: new Date().toISOString()
      });
    }

    console.log('✅ Password updated for:', email);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({ error: error.message });
  }
});

// Disable/Enable user
app.patch('/users/:email/disabled', async (req, res) => {
  try {
    const { email } = req.params;
    const { disabled } = req.body;

    if (typeof disabled !== 'boolean') {
      return res.status(400).json({ error: 'disabled must be boolean' });
    }

    const emailKey = sanitizeEmail(email);
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(emailKey).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Update Firebase Auth
    if (userData.uid) {
      await admin.auth().updateUser(userData.uid, {
        disabled: disabled
      });
    }

    // Update Firestore
    await db.collection('users').doc(emailKey).update({
      disabled: disabled,
      updatedAt: new Date().toISOString()
    });

    if (userData.uid && userData.uid !== emailKey) {
      await db.collection('users').doc(userData.uid).update({
        disabled: disabled,
        updatedAt: new Date().toISOString()
      });
    }

    console.log(`✅ User ${disabled ? 'disabled' : 'enabled'}:`, email);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete('/users/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const emailKey = sanitizeEmail(email);
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(emailKey).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Delete from Firebase Auth
    if (userData.uid) {
      await admin.auth().deleteUser(userData.uid);
    }

    // Delete from Firestore
    await db.collection('users').doc(emailKey).delete();
    if (userData.uid && userData.uid !== emailKey) {
      await db.collection('users').doc(userData.uid).delete();
    }

    console.log('✅ User deleted:', email);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record login
app.post('/users/:email/login', async (req, res) => {
  try {
    const { email } = req.params;
    const { uid } = req.body;

    const result = await recordUserLogin(email, uid);
    
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error recording login:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get login history
app.get('/users/:email/login-history', async (req, res) => {
  try {
    const { email } = req.params;

    const emailKey = sanitizeEmail(email);
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(emailKey).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    res.json({
      lastLogin: userData.lastLogin || null,
      loginHistory: userData.loginHistory || []
    });
  } catch (error) {
    console.error('❌ Error getting login history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Note: Firebase Auth doesn't have a direct "user signed in" trigger.
// The frontend app should call the /users/:email/login endpoint when users sign in.
// This is already implemented in the admin portal, and should be added to the NextElite app.

// Export as Cloud Function (1st Gen)
// Using functions.https.onRequest explicitly to ensure 1st Gen
exports.api = functions.https.onRequest(app);

