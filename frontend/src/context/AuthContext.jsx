import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(tokenStore.get()));

  // Al abrir la app, si hay token guardado se recupera el usuario
  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then((d) => setUsuario(d.usuario))
      .catch((err) => {
        if (err.status === 401) tokenStore.clear();
      })
      .finally(() => setCargando(false));
  }, []);

  // El cliente HTTP emite este evento cuando el token expira
  useEffect(() => {
    const salir = () => {
      tokenStore.clear();
      setUsuario(null);
    };
    window.addEventListener('skillswap:logout', salir);
    return () => window.removeEventListener('skillswap:logout', salir);
  }, []);

  const iniciarSesion = useCallback(async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    tokenStore.set(d.token);
    setUsuario(d.usuario);
    return d.usuario;
  }, []);

  const registrarse = useCallback(async (datos) => {
    const d = await api('/auth/register', { method: 'POST', body: datos });
    tokenStore.set(d.token);
    setUsuario(d.usuario);
    return d.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    tokenStore.clear();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      tieneRol: (rol) => Boolean(usuario?.roles?.includes(rol)),
    }),
    [usuario, cargando, iniciarSesion, registrarse, cerrarSesion]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
