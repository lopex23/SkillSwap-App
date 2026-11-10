import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Campo, MensajeError } from '../components/ui';

const ROLES = [
  { valor: 'estudiante', titulo: 'Estudiante', texto: 'Quiero recibir tutorías' },
  { valor: 'tutor', titulo: 'Tutor', texto: 'Quiero enseñar a otros' },
];

export default function Registro() {
  const { usuario, registrarse } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    carrera: '',
    semestre: '',
    rol: params.get('rol') === 'tutor' ? 'tutor' : 'estudiante',
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Si ya había sesión al entrar, ir al panel. Mientras se envía el formulario
  // no se redirige aquí: lo hace enviar() hacia la página correcta.
  if (usuario && !enviando) return <Navigate to="/panel" replace />;

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const err = (campo) => error?.errores?.[campo];

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const datos = { ...form, semestre: form.semestre === '' ? null : Number(form.semestre) };
      const u = await registrarse(datos);
      // Un tutor nuevo primero debe registrar sus materias y horarios
      navigate(u.roles.includes('tutor') ? '/perfil-tutor' : '/panel', { replace: true });
    } catch (ex) {
      setError(ex);
      setEnviando(false);
    }
  };

  return (
    <div className="auth">
      <form className="tarjeta auth-tarjeta auth-ancha" onSubmit={enviar} noValidate>
        <h1>Crear cuenta</h1>
        <p className="texto-suave">Únete a SkillSwap en menos de un minuto.</p>

        {/* El 409 (email repetido) se muestra junto al campo email */}
        <MensajeError error={error && error.status !== 409 ? error : null} />

        <fieldset className="selector-rol">
          <legend className="campo-label">¿Cómo vas a usar SkillSwap?</legend>
          {ROLES.map((r) => (
            <label key={r.valor} className={form.rol === r.valor ? 'opcion-rol activa' : 'opcion-rol'}>
              <input type="radio" name="rol" value={r.valor} checked={form.rol === r.valor} onChange={cambiar} />
              <strong>{r.titulo}</strong>
              <span>{r.texto}</span>
            </label>
          ))}
        </fieldset>

        <div className="fila-2">
          <Campo label="Nombre" error={err('nombre')}>
            <input name="nombre" autoComplete="given-name" value={form.nombre} onChange={cambiar} />
          </Campo>
          <Campo label="Apellido" error={err('apellido')}>
            <input name="apellido" autoComplete="family-name" value={form.apellido} onChange={cambiar} />
          </Campo>
        </div>

        <Campo label="Email" error={err('email') || (error?.status === 409 ? error.message : null)}>
          <input name="email" type="email" autoComplete="email" value={form.email} onChange={cambiar} />
        </Campo>
        <Campo label="Contraseña" error={err('password')} ayuda="Mínimo 8 caracteres">
          <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={cambiar} />
        </Campo>

        <div className="fila-2">
          <Campo label="Carrera (opcional)" error={err('carrera')}>
            <input name="carrera" value={form.carrera} onChange={cambiar} placeholder="Ej. Psicología" />
          </Campo>
          <Campo label="Semestre (opcional)" error={err('semestre')}>
            <select name="semestre" value={form.semestre} onChange={cambiar}>
              <option value="">—</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="auth-pie">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
