# Fix Both Issues - Deploy Instructions

## Issue 1: Login Error - Fixed ✅

**Error:** `userDoc.exists is not a function`

**Fix:** Changed all `userDoc.exists()` to `userDoc.exists` (property, not function) in Firebase Admin SDK.

## Issue 2: Tabs Not Showing - Fixed ✅

**Problem:** Tabs visible in `npm run dev` but not in deployed version.

**Fix:** Code is correct. Need to rebuild and redeploy to include latest changes.

## Deploy Steps

### Step 1: Deploy Functions (Fix Login Error)

```bash
cd nextelitebackend
firebase deploy --only functions
```

### Step 2: Deploy Frontend (Include Tabs)

```bash
firebase deploy --only hosting
```

### Or Deploy Everything at Once:

```bash
npm run deploy
```

## After Deployment

1. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear cache in browser settings

2. **Check Tabs:**
   - Should see: All, Teachers, Assistants, Students, Parents
   - Each tab shows count in parentheses

3. **Test Login:**
   - Login should work without errors
   - Login history should record properly

## Verify

- ✅ Tabs visible at top of dashboard
- ✅ Can click tabs to filter users
- ✅ No login errors in console
- ✅ Login history works

