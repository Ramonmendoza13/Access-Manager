import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export interface PrivateRouteProps {
  redirectPath?: string;
}

export default function PrivateRoute({ redirectPath = '/login' }: PrivateRouteProps) {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
