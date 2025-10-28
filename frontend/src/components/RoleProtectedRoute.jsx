import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Role-based Protected Route Component
 * Ensures only users with specific roles can access certain routes
 * 
 * @param {string|string[]} allowedRoles - Single role or array of roles allowed to access this route
 * @param {JSX.Element} children - The component to render if authorized
 * @param {string} redirectTo - Where to redirect if unauthorized (default: '/login')
 */
export default function RoleProtectedRoute({ allowedRoles, children, redirectTo = '/login' }) {
  const { isAuthenticated, user } = useAuth();
  
  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Normalize allowedRoles to array
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  // Check if user has required role
  const hasRequiredRole = user && user.role && rolesArray.includes(user.role);
  
  if (!hasRequiredRole) {
    // Redirect based on actual role
    if (user?.role === 'Admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === 'Employee') {
      return <Navigate to="/employee/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  // User is authenticated and has required role
  return children;
}
