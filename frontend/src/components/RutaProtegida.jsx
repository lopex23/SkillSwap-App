import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cargando, Vacio } from './ui';

// Exige sesión iniciada y, opcionalmente, alguno de los roles indicados.
export default function RutaProtegida({ roles, children }) {
  const { usuario, cargando, tieneRol } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando texto="Verificando sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  if (roles && !roles.some(tieneRol)) {
    return (
      <Vacio titulo="No tienes acceso a esta sección">
        Esta página es solo para: {roles.join(', ')}.
      </Vacio>
    );
  }
  return children;
}
