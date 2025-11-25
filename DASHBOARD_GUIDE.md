# Admin Dashboard Guide

## ✅ Yes! You Have a Full Admin Dashboard

The `nextelitebackend` project includes a complete admin portal with a web-based dashboard for all user management operations.

## 🎯 What You Can Do in the Dashboard

### 1. **View All Users**
- See all users in a table
- Columns: Email, Name, Role, Last Login, Status
- Search by email, name, or UID
- Filter by role (teacher, student, parent, assistant)

### 2. **Create New Users**
- Click **"+ Add User"** button
- Fill in:
  - Email
  - Password
  - Name
  - Role (teacher, student, parent, assistant)
- Creates user in both Firebase Auth and Firestore automatically

### 3. **Change Password**
- Find user in list
- Click **"🔐 Change PW"** button
- Enter new password
- Password updated directly in Firebase Auth

### 4. **Disable/Enable Users**
- Find user in list
- Click **"✗ Disable"** or **"✓ Enable"** button
- User is disabled/enabled in Firebase Auth

### 5. **Delete Users**
- Find user in list
- Click **"🗑️ Delete"** button
- Confirm deletion
- User deleted from both Firebase Auth and Firestore

### 6. **View Login History**
- Find user in list
- Click **"📊 History"** button
- See last login time and full login history

### 7. **Send Password Reset Email**
- Find user in list
- Click **"📧 Reset Email"** button
- Sends password reset email to user

## 🚀 How to Access the Dashboard

### Option 1: Local Development

1. **Start Backend Server** (Terminal 1):
   ```bash
   cd nextelitebackend
   npm run server
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd nextelitebackend
   npm run dev
   ```

3. **Open Browser:**
   - Usually opens at `http://localhost:5173`
   - Login with: `teacher@nextelite.ai`

### Option 2: Deployed (Production)

1. **Deploy Everything:**
   ```bash
   cd nextelitebackend
   npm run deploy
   ```

2. **Access Your Deployed Portal:**
   - Go to your Firebase Hosting URL
   - Usually: `https://nextelitebn.web.app` (or your custom domain)
   - Login with: `teacher@nextelite.ai`

## 🔐 Login Requirements

**Only this email can access the admin portal:**
- `teacher@nextelite.ai`

The dashboard checks for this specific email and blocks all other users.

## 📊 Dashboard Features

### User List Table
- **Email** - User's email address
- **Name** - Display name
- **Role** - Color-coded badges (teacher, student, parent, assistant)
- **Last Login** - Date and time of last login (or "Never")
- **Status** - Active or Disabled badge
- **Actions** - All action buttons

### Search & Filter
- **Search Bar** - Search by email, name, or UID
- **Role Filter** - Filter by specific role
- **Real-time** - Updates as you type

### Action Buttons
- **✗ Disable / ✓ Enable** - Toggle user status
- **🔐 Change PW** - Direct password change
- **📧 Reset Email** - Send password reset email
- **📊 History** - View login history
- **🗑️ Delete** - Delete user permanently

## 🎨 Visual Features

- **Color-coded Roles:**
  - Teacher: Purple
  - Student: Blue
  - Parent: Green
  - Assistant: Orange

- **Status Indicators:**
  - Active: Green badge
  - Disabled: Red badge (with grayed-out row)

- **Last Login Display:**
  - Shows date and time
  - "Never" if user hasn't logged in

## 🔧 Additional Tools

The dashboard also includes utility buttons:

1. **Migrate Existing Users** - Migrate users from old format
2. **Create Missing Documents** - Create Firestore docs for Auth users
3. **Remove Duplicates** - Clean up duplicate user documents

## 📱 Responsive Design

The dashboard works on:
- Desktop computers
- Tablets
- Mobile phones (with horizontal scroll for table)

## 🐛 Troubleshooting

### Can't Access Dashboard

1. **Check you're logged in as:** `teacher@nextelite.ai`
2. **Check backend is running** (for local development)
3. **Check functions are deployed** (for production)

### "Failed to fetch" Errors

1. **Local:** Make sure `npm run server` is running
2. **Production:** Check functions are deployed and accessible

### Users Not Showing

1. Check Firestore `users` collection has documents
2. Try refreshing the page
3. Check browser console for errors

## 🎯 Quick Start

1. **Deploy everything:**
   ```bash
   npm run deploy
   ```

2. **Access dashboard:**
   - Go to your Firebase Hosting URL
   - Login with `teacher@nextelite.ai`

3. **Start managing users!**
   - Create, edit, delete users
   - View login history
   - Change passwords
   - All from the web interface!

## 📸 What It Looks Like

The dashboard has:
- **Header** - Shows "NextElite Admin Portal" and logged-in user
- **Toolbar** - Search, filter, and "Add User" button
- **User Table** - All users with actions
- **Modals** - For creating users and viewing login history

Everything is styled with a modern, clean design matching your app's theme.

---

**You don't need to use Firebase Console or command line - everything is in the dashboard!** 🎉

