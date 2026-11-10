import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Campo, MensajeError } from '../components/ui';

export default function Login() {
  const { usuario, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Mientras se envía no se redirige aquí: enviar() vuelve a la página de origen
  if (usuario && !enviando) return <Navigate to="/panel" replace />;

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(form.email, form.password);
      navigate(location.state?.desde || '/panel', { replace: true });
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  };

  return (
    <div className="auth">
      <form className="tarjeta auth-tarjeta" onSubmit={enviar} noValidate>
        <h1>Iniciar sesión</h1>
        <p className="texto-suave">Bienvenido de nuevo a SkillSwap.</p>

        <MensajeError error={error} />

        <Campo label="Email">
          <input name="email" type="email" autoComplete="email" required value={form.email} onChange={cambiar} />
        </Campo>
        <Campo label="Contraseña">
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={cambiar}
          />
        </Campo>

        <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>

        <p className="auth-pie">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}
