import './UserList.css'

function UserList({ users, onDisable, onResetPassword, onFixDocument, onChangePassword, onDelete, onViewLoginHistory, onEdit }) {
  if (users.length === 0) {
    return (
      <div className="empty-state">
        <p>No users found</p>
      </div>
    )
  }

  return (
    <div className="user-list-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Last Login</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={user.disabled ? 'disabled-user' : ''}>
              <td>{user.email || 'N/A'}</td>
              <td>{user.name || 'N/A'}</td>
              <td>
                <span className={`role-badge role-${user.role || 'unknown'}`}>
                  {user.role || 'N/A'}
                </span>
              </td>
              <td className="last-login-cell">
                {user.lastLogin ? (
                  <div>
                    <div>{new Date(user.lastLogin).toLocaleDateString()}</div>
                    <div className="last-login-time">{new Date(user.lastLogin).toLocaleTimeString()}</div>
                  </div>
                ) : (
                  <span className="no-login">Never</span>
                )}
              </td>
              <td>
                <span className={`status-badge ${user.disabled ? 'disabled' : 'active'}`}>
                  {user.disabled ? 'Disabled' : 'Active'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  {user.email && (
                    <button
                      onClick={() => onEdit(user)}
                      className="action-btn edit-btn"
                      title="Edit user"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  <button
                    onClick={() => onDisable(user.email, user.disabled || false)}
                    className={`action-btn ${user.disabled ? 'enable-btn' : 'disable-btn'}`}
                    title={user.disabled ? 'Enable user' : 'Disable user'}
                  >
                    {user.disabled ? '✓ Enable' : '✗ Disable'}
                  </button>
                  {user.email && (
                    <>
                      <button
                        onClick={() => onChangePassword(user.email)}
                        className="action-btn change-pw-btn"
                        title="Change password directly"
                      >
                        🔐 Change PW
                      </button>
                      <button
                        onClick={() => onResetPassword(user.email)}
                        className="action-btn reset-btn"
                        title="Send password reset email"
                      >
                        📧 Reset Email
                      </button>
                      <button
                        onClick={() => onViewLoginHistory(user.email)}
                        className="action-btn history-btn"
                        title="View login history"
                      >
                        📊 History
                      </button>
                      <button
                        onClick={() => onDelete(user.email)}
                        className="action-btn delete-btn"
                        title="Delete user"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UserList

