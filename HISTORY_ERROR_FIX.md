# Fix: Login History "Failed to fetch" Error

## Problem

When clicking "📊 History" button, you see:
```
Error getting login history: TypeError: Failed to fetch
net::ERR_CONNECTION_REFUSED
```

## Root Cause

The backend server is **not running**. The frontend is trying to connect to `http://localhost:3001` but nothing is listening.

## Solution

### For Local Development

**Start the backend server:**

1. Open a terminal
2. Navigate to the project:
   ```bash
   cd nextelitebackend
   ```
3. Start the server:
   ```bash
   npm run server
   ```
4. You should see:
   ```
   ✅ Firebase Admin initialized...
   Backend server running on port 3001
   ```
5. **Keep this terminal running!**
6. Now try clicking "📊 History" again - it should work

### For Production (Deployed)

If you're accessing the deployed admin portal:

1. **Make sure Cloud Functions are deployed:**
   ```bash
   firebase deploy --only functions
   ```

2. **Check function is accessible:**
   - Go to Firebase Console → Functions
   - Verify `api` function is deployed
   - Test: `curl https://us-central1-nextelite-89f47.cloudfunctions.net/api/health`

3. **Rebuild and redeploy frontend:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Quick Check

**Test if backend is running:**

Open in browser:
- Local: `http://localhost:3001/api/health`
- Production: `https://us-central1-nextelite-89f47.cloudfunctions.net/api/health`

Should return: `{"status":"ok",...}`

## Updated Error Messages

I've improved the error handling to show clearer messages:

- **Connection refused** → Shows instructions to start backend server
- **Timeout** → Shows backend may not be responding
- **User not found** → Suggests using "Fix Doc" button

## Prevention

**Always start backend before using admin portal locally:**

```bash
# Terminal 1: Backend
cd nextelitebackend
npm run server

# Terminal 2: Frontend  
cd nextelitebackend
npm run dev
```

Or use the deployed version which doesn't need a local backend!

