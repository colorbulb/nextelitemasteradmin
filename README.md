# NextElite Admin Portal

Admin portal for managing NextElite users, including authentication, user management, and account controls.

## Features

- **Admin Authentication**: Secure login restricted to `teacher@nextelite.ai`
- **User Management**:
  - View all users from Firestore
  - Add new users (students, teachers, parents)
  - Disable/Enable user accounts
  - Send password reset emails
- **Search & Filter**: Search users by email, name, or UID, and filter by role

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Deploy:
```bash
npm run deploy
```

## Admin Access

- **Master Admin Email**: `teacher@nextelite.ai`
- Only this email can access the admin portal
- All other users will be denied access

## User Management

### Adding Users
- Click "Add User" button
- Fill in email, password, name, and role
- User will be created in Firebase Auth and Firestore
- User document will also be added to role-specific collection (students, teachers, parents)

### Disabling/Enabling Users
- Click "Disable" or "Enable" button next to any user
- Updates the `disabled` field in Firestore
- Disabled users are visually indicated in the list

### Password Reset
- Click "Reset PW" button next to any user
- Sends a password reset email to the user's email address
- User can then set a new password via the email link

## Project Structure

```
src/
  ├── components/
  │   ├── Login.jsx          # Login page
  │   ├── Dashboard.jsx      # Main dashboard
  │   ├── UserList.jsx       # User list table
  │   └── AddUserModal.jsx   # Add user modal
  ├── firebase/
  │   └── config.js          # Firebase configuration
  ├── App.jsx                # Main app component
  └── main.jsx               # Entry point
```

## Firebase Collections

The portal interacts with the following Firestore collections:
- `users` - Main user collection
- `students` - Student-specific data
- `teachers` - Teacher-specific data
- `parents` - Parent-specific data

