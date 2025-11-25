# Deploy Everything - Complete Guide

## Quick Deploy (Recommended)

Use the deploy script which handles everything:

```bash
cd nextelitebackend
npm run deploy
```

This will:
1. ✅ Build the frontend
2. ✅ Deploy Cloud Functions
3. ✅ Deploy Hosting (frontend)
4. ✅ Commit to Git

## Manual Deploy Steps

### Step 1: Delete Existing Function (If Needed)

If you get the "Upgrading from 1st Gen to 2nd Gen" error:

```bash
firebase functions:delete api --region us-central1
```

Type `y` when prompted.

### Step 2: Build Frontend

```bash
npm run build
```

### Step 3: Deploy Functions

```bash
firebase deploy --only functions
```

**Note:** It's `functions` (plural), not `function` (singular)

### Step 4: Deploy Hosting (Frontend)

```bash
firebase deploy --only hosting
```

### Step 5: Deploy Everything at Once

```bash
firebase deploy
```

This deploys both functions and hosting.

## What Gets Deployed

### ✅ Frontend (Hosting)
- Admin dashboard with role tabs
- User management UI
- All components and features
- **Includes the new role tabs!**

### ✅ Backend (Functions)
- User creation API
- Password change API
- Disable/enable API
- Delete user API
- Login history API

## Verify Deployment

### Check Functions
```bash
firebase functions:list
```

Should show `api` function.

### Check Hosting
- Go to your Firebase Hosting URL
- Usually: `https://nextelitebn.web.app`
- Login with `teacher@nextelite.ai`

### Test Features
1. ✅ See role tabs (All, Teachers, Assistants, Students, Parents)
2. ✅ Create users
3. ✅ View login history
4. ✅ All other features

## Common Commands

| Command | What It Does |
|---------|-------------|
| `npm run deploy` | Deploy everything (recommended) |
| `firebase deploy` | Deploy everything |
| `firebase deploy --only functions` | Deploy functions only |
| `firebase deploy --only hosting` | Deploy frontend only |
| `firebase functions:list` | List deployed functions |
| `firebase functions:delete api` | Delete function |

## Troubleshooting

### "No targets match"
- Make sure you're in the `nextelitebackend` directory
- Check `firebase.json` exists
- Use `functions` (plural), not `function`

### "Upgrading from 1st Gen to 2nd Gen"
- Delete existing function first: `firebase functions:delete api --region us-central1`
- Then deploy again

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check for TypeScript/ESLint errors

## After Deployment

1. ✅ Access your admin portal at the Hosting URL
2. ✅ Login with `teacher@nextelite.ai`
3. ✅ See the new role tabs!
4. ✅ All features should work

The role tabs feature is already in the code, so it will be included automatically when you deploy the frontend! 🎉

