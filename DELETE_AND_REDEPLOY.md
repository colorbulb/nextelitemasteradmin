# Fix: Delete Existing Function and Redeploy

## Problem

You're getting:
```
Error: Upgrading from 1st Gen to 2nd Gen is not yet supported.
```

This means there's already a **2nd Gen function** deployed with the name `api`, and Firebase can't automatically convert it to 1st Gen.

## Solution: Delete and Redeploy

### Step 1: Delete the Existing Function

Run this command (it will ask for confirmation):

```bash
cd nextelitebackend
firebase functions:delete api --region us-central1
```

When prompted, type `y` to confirm.

### Step 2: Deploy the New 1st Gen Function

After deletion, deploy again:

```bash
firebase deploy --only functions
```

This will deploy a fresh 1st Gen function.

## Alternative: Delete via Firebase Console

If the command doesn't work:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **nextelite-89f47**
3. Go to **Functions**
4. Find the `api` function
5. Click the **three dots** (⋮) menu
6. Click **Delete**
7. Confirm deletion
8. Then run: `firebase deploy --only functions`

## Why This Happens

- A 2nd Gen function was previously deployed (maybe by Firebase auto-upgrading)
- You're now trying to deploy a 1st Gen function with the same name
- Firebase doesn't support downgrading from 2nd Gen to 1st Gen
- Solution: Delete the old one, deploy the new one

## After Deletion

Once deleted, your new 1st Gen function will deploy successfully and work perfectly!

