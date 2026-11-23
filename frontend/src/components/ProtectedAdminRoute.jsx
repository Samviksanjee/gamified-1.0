import { Navigate } from 'react-router-dom';

/**
 * ProtectedAdminRoute Component
 * Protects Super Admin pages by verifying authentication and role
 * 
 * @param {Object} props
 * @param {React.Component} props.component - Component to render if authorized
 * @param {Object} props.user - The current user object from App context
 * @param {Function} props.onSignOut - Callback for sign out
 * @returns {React.ReactNode} - The protected component or a redirect
 */
export default function ProtectedAdminRoute({
  component: Component,
  user,
  onSignOut,
  ...rest
}) {
  // Check if user exists and has super_admin role
  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/admin/setup" replace />;
  }

  // Render the protected component if authorized
  return <Component user={user} onSignOut={onSignOut} {...rest} />;
}
