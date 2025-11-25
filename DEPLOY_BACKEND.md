# Deploy Backend to Firebase Cloud Functions

This guide shows you how to deploy the backend server to Firebase Cloud Functions so it runs automatically after deployment.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in: `firebase login`
3. Project initialized: `firebase use nextelite-89f47`

## Step 1: Install Function Dependencies

```bash
cd nextelitebackend
cd functions
npm install
cd ..
```

## Step 2: Deploy Functions

```bash
firebase deploy --only functions
```

This will deploy the backend API as a Cloud Function.

## Step 3: Get Function URL

After deployment, Firebase will show you the function URL. It will look like:

```
https://us-central1-nextelite-89f47.cloudfunctions.net/api
```

**Save this URL!** You'll need it for the frontend.

## Step 4: Update Frontend to Use Deployed Function

### Option 1: Environment Variable (Recommended)

Create a `.env.production` file:

```bash
VITE_FUNCTION_URL=https://us-central1-nextelite-89f47.cloudfunctions.net/api
```

### Option 2: Update Code Directly

The code in `src/services/userService.js` already checks for `VITE_FUNCTION_URL`. If not set, it will try to construct the URL automatically.

## Step 5: Deploy Frontend

```bash
npm run build
firebase deploy --only hosting
```

## Step 6: Verify Deployment

1. **Check Function Status:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: **nextelite-89f47**
   - Go to **Functions**
   - You should see `api` function deployed

2. **Test Function:**
   ```bash
   curl https://us-central1-nextelite-89f47.cloudfunctions.net/api/health
   ```
   Should return: `{"status":"ok","service":"nextelite-backend",...}`

3. **Test in Browser:**
   - Open your deployed admin portal
   - Try creating a user
   - Should work without "Failed to fetch" errors

## Full Deployment Script

You can update `deploy.js` to deploy both functions and hosting:

```javascript
// In deploy.js, add before hosting deploy:
exec('firebase deploy --only functions');
exec('firebase deploy --only hosting');
```

## Troubleshooting

### Function Not Deploying

1. Check Node.js version:
   ```bash
   node --version  # Should be 18.x
   ```

2. Check Firebase CLI:
   ```bash
   firebase --version
   ```

3. Check function logs:
   ```bash
   firebase functions:log
   ```

### Function URL Not Working

1. Check function is deployed:
   - Firebase Console → Functions
   - Should see `api` function

2. Check function URL:
   - Click on function in console
   - Copy the trigger URL

3. Test with curl:
   ```bash
   curl https://YOUR-FUNCTION-URL/health
   ```

### Frontend Still Using Localhost

1. Make sure you built for production:
   ```bash
   npm run build
   ```

2. Check `.env.production` file exists

3. Check `VITE_FUNCTION_URL` is set correctly

4. Clear browser cache and reload

## Environment Variables

### Development
- Uses: `http://localhost:3001/api`
- Set in: `userService.js` (automatic)

### Production
- Uses: Cloud Function URL
- Set via: `VITE_FUNCTION_URL` environment variable
- Or: Auto-detected from hostname

## Monitoring

View function logs:
```bash
firebase functions:log
```

View in Firebase Console:
- Firebase Console → Functions → api → Logs

## Cost Considerations

Cloud Functions have a free tier:
- 2 million invocations/month free
- 400,000 GB-seconds compute time/month free

For most admin portals, this is more than enough.

## Security

The Cloud Function automatically:
- Uses Firebase Admin SDK (full permissions)
- No need for service account key in production
- Secure by default

## Next Steps

After deployment:
1. ✅ Test creating a user
2. ✅ Test changing password
3. ✅ Test disabling user
4. ✅ Test deleting user
5. ✅ Check login history works

All should work without needing a local backend server!

