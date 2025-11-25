# Quick Start Guide

## ⚠️ IMPORTANT: Backend Server Must Be Running!

The admin portal requires a **backend server** to be running. Without it, you'll get "Failed to fetch" errors.

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd nextelitebackend
npm install
```

### 2. Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **nextelite-89f47**
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the file as `service-account-key.json` in the `nextelitebackend` folder
6. **Never commit this file!**

### 3. Start Backend Server

**Open Terminal 1:**

```bash
cd nextelitebackend
npm run server
```

You should see:
```
✅ Firebase Admin initialized with service account
Backend server running on port 3001
API endpoints available at http://localhost:3001/api/users
```

**Keep this terminal running!** The backend must stay running.

### 4. Start Frontend

**Open Terminal 2 (new terminal):**

```bash
cd nextelitebackend
npm run dev
```

The frontend will open in your browser.

## ✅ Verify It's Working

1. Backend server shows: "Backend server running on port 3001"
2. Frontend loads without errors
3. You can create users without "Failed to fetch" errors

## 🐛 Troubleshooting

### "Failed to fetch" Error

**Problem:** Backend server is not running.

**Solution:**
1. Check Terminal 1 - is the server running?
2. Look for: "Backend server running on port 3001"
3. If not, start it: `npm run server`

### "Firebase Admin not initialized"

**Problem:** Service account key is missing.

**Solution:**
1. Make sure `service-account-key.json` exists in the root folder
2. Check the file name is exactly: `service-account-key.json`
3. Re-download from Firebase Console if needed

### "Permission denied"

**Problem:** Service account lacks permissions.

**Solution:**
1. Go to [Google Cloud Console IAM](https://console.cloud.google.com/iam-admin/iam?project=nextelite-89f47)
2. Find your service account (from the JSON file's `client_email`)
3. Add these roles:
   - **Cloud Datastore User**
   - **Firebase Admin SDK Administrator Service Agent**
   - **Service Usage Consumer**
4. Wait 2-3 minutes and restart backend server

### Port Already in Use

**Problem:** Port 3001 is already in use.

**Solution:**
1. Find what's using port 3001:
   ```bash
   lsof -i :3001
   ```
2. Kill the process or change PORT in `server.js`

## 📝 Common Workflow

1. **Always start backend first:**
   ```bash
   npm run server
   ```

2. **Then start frontend:**
   ```bash
   npm run dev
   ```

3. **To stop:**
   - Press `Ctrl+C` in both terminals

## 🎯 Testing Backend

Test if backend is running:

```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","service":"nextelite-backend"}`

