# How to Access Deployed Backend

After deploying to Firebase Cloud Functions, here's how to access it:

## 1. Get Your Function URL

### Option A: From Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **nextelite-89f47**
3. Click **Functions** in the left sidebar
4. You'll see your `api` function
5. Click on it to see details
6. Copy the **Trigger URL** - it looks like:
   ```
   https://us-central1-nextelite-89f47.cloudfunctions.net/api
   ```

### Option B: From Deployment Output

After running `firebase deploy --only functions`, the output will show:
```
✔  functions[api(us-central1)] Successful create operation.
Function URL (api): https://us-central1-nextelite-89f47.cloudfunctions.net/api
```

## 2. Test the Backend

### Health Check

Open in browser or use curl:
```bash
curl https://us-central1-nextelite-89f47.cloudfunctions.net/api/health
```

Should return:
```json
{"status":"ok","service":"nextelite-backend","timestamp":"..."}
```

### API Endpoints

All endpoints are under `/api`:

- **Health:** `GET /api/health`
- **Create User:** `POST /api/users`
- **Change Password:** `PATCH /api/users/:email/password`
- **Disable User:** `PATCH /api/users/:email/disabled`
- **Delete User:** `DELETE /api/users/:email`
- **Record Login:** `POST /api/users/:email/login`
- **Login History:** `GET /api/users/:email/login-history`

## 3. Access from Frontend

### Automatic Detection

The frontend code in `src/services/userService.js` automatically detects if you're in production and uses the Cloud Function URL.

**It checks:**
- If `VITE_FUNCTION_URL` environment variable is set → uses that
- If hostname is NOT `localhost` → auto-constructs Cloud Function URL
- Otherwise → uses `http://localhost:3001/api` for development

### Manual Configuration (Optional)

If auto-detection doesn't work, create `.env.production` file:

```bash
VITE_FUNCTION_URL=https://us-central1-nextelite-89f47.cloudfunctions.net/api
```

Then rebuild:
```bash
npm run build
firebase deploy --only hosting
```

## 4. Verify It's Working

### In Browser Console

1. Open your deployed admin portal
2. Open browser DevTools (F12)
3. Go to Console tab
4. Try creating a user
5. Should see successful API calls (no "Failed to fetch" errors)

### Test API Directly

```bash
# Test health endpoint
curl https://us-central1-nextelite-89f47.cloudfunctions.net/api/health

# Test creating a user (replace with your admin credentials)
curl -X POST https://us-central1-nextelite-89f47.cloudfunctions.net/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User",
    "role": "student"
  }'
```

## 5. View Function Logs

### From Firebase Console

1. Go to Firebase Console → Functions
2. Click on `api` function
3. Click **Logs** tab
4. See all function invocations and errors

### From Command Line

```bash
firebase functions:log
```

Or for specific function:
```bash
firebase functions:log --only api
```

## 6. Common URLs

### Your Deployed Backend API:
```
https://us-central1-nextelite-89f47.cloudfunctions.net/api
```

### Health Check:
```
https://us-central1-nextelite-89f47.cloudfunctions.net/api/health
```

### Your Admin Portal (Hosting):
```
https://nextelitebn.web.app
```
(or whatever your Firebase Hosting URL is)

## 7. Troubleshooting

### "Failed to fetch" in Production

1. **Check function is deployed:**
   - Firebase Console → Functions → Should see `api` function

2. **Check function URL:**
   - Copy the exact URL from Firebase Console
   - Test with curl to verify it works

3. **Check frontend is using correct URL:**
   - Open browser DevTools → Network tab
   - Try creating a user
   - Check the request URL - should be your Cloud Function URL

4. **Rebuild frontend:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Function Not Found

1. Make sure you deployed functions:
   ```bash
   firebase deploy --only functions
   ```

2. Check Firebase Console → Functions → Should see your function

3. Wait a few minutes - deployment can take 1-2 minutes

### CORS Errors

The function already has CORS enabled. If you see CORS errors:
- Check the function is deployed correctly
- Verify the URL is correct
- Check browser console for exact error

## 8. Quick Reference

| What | URL |
|------|-----|
| Backend API Base | `https://us-central1-nextelite-89f47.cloudfunctions.net/api` |
| Health Check | `https://us-central1-nextelite-89f47.cloudfunctions.net/api/health` |
| Create User | `POST /api/users` |
| Change Password | `PATCH /api/users/:email/password` |
| Disable User | `PATCH /api/users/:email/disabled` |
| Delete User | `DELETE /api/users/:email` |
| Login History | `GET /api/users/:email/login-history` |

## 9. Next Steps

After deployment:
1. ✅ Test health endpoint
2. ✅ Test creating a user from admin portal
3. ✅ Check function logs for any errors
4. ✅ Verify login history is being recorded

Your backend is now live and accessible from anywhere! 🎉

