# Backend Server Setup

This backend server provides user management APIs using Firebase Admin SDK.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Save as `service-account-key.json` in the root directory
5. **Never commit this file!** (It's in `.gitignore`)

### 3. Start Backend Server

```bash
npm run server
```

Or for development with auto-reload:

```bash
npm run dev:server
```

The server will run on `http://localhost:3001`

## API Endpoints

### Create User
```
POST /api/users
Body: { email, password, name, role }
```

### Change Password
```
PATCH /api/users/:email/password
Body: { password }
```

### Disable/Enable User
```
PATCH /api/users/:email/disabled
Body: { disabled: true/false }
```

### Delete User
```
DELETE /api/users/:email
```

### Record Login
```
POST /api/users/:email/login
Body: { uid }
```

### Get Login History
```
GET /api/users/:email/login-history
```

## Frontend Configuration

The frontend uses the `userService` which calls these APIs. Make sure the backend server is running before using the admin portal.

## Required Permissions

The service account needs these roles in Google Cloud Console:
- **Cloud Datastore User** (for Firestore)
- **Firebase Admin SDK Administrator Service Agent**
- **Service Usage Consumer** (for Firebase Auth API)

## Troubleshooting

### "Firebase Admin not initialized"
- Make sure `service-account-key.json` exists
- Or run `firebase login` for default credentials

### "Permission denied"
- Check service account has required roles
- Wait 2-3 minutes after granting permissions

### "Port already in use"
- Change PORT in `server.js` or set `PORT` environment variable

