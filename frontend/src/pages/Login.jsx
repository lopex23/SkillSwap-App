import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Campo, MensajeError } from '../components/ui';
import AuthLayout, { InputPassword } from '../components/AuthLayout';

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
    <AuthLayout
      titulo="Qué bueno verte de nuevo"
      puntos={['Revisa tus próximas sesiones', 'Responde solicitudes de tus materias', 'Sigue tu progreso por materia']}
    >
      <form className="formulario" onSubmit={enviar} noValidate>
        <div className="apilado">
          <h1>Iniciar sesión</h1>
          <p className="texto-suave">
            {location.state?.desde ? 'Inicia sesión para continuar.' : 'Ingresa con tu email y contraseña.'}
          </p>
        </div>

        <MensajeError error={error} />

        <Campo label="Email">
          <span className="input-con-icono">
            <Mail size={17} aria-hidden="true" />
            <input name="email" type="email" autoComplete="email" required value={form.email} onChange={cambiar} />
          </span>
        </Campo>
        <Campo label="Contraseña">
          <InputPassword value={form.password} onChange={cambiar} autoComplete="current-password" />
        </Campo>

        <button type="submit" className="btn btn-primario btn-lg btn-bloque" disabled={enviando}>
          <LogIn size={18} /> {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>

        <p className="auth-pie">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={location.state}>
            Regístrate gratis
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
