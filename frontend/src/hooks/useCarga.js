import { useCallback, useEffect, useState } from 'react';

// Ejecuta una función async al montar (y cuando cambian deps) y expone su estado.
// Uso: const { data, error, cargando, recargar } = useCarga(() => api('/materias'), []);
export function useCarga(fn, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setData(await fn());
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
    }
  }, deps);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { data, error, cargando, recargar };
}
