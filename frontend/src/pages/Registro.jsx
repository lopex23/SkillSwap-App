import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, HeartHandshake, Mail, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Campo, MensajeError } from '../components/ui';
import AuthLayout, { InputPassword } from '../components/AuthLayout';

const ROLES = [
  { valor: 'estudiante', titulo: 'Estudiante', texto: 'Quiero recibir tutorías', Icono: GraduationCap },
  { valor: 'tutor', titulo: 'Tutor', texto: 'Quiero enseñar a otros', Icono: HeartHandshake },
];

// 0 = vacía, 1 = débil, 2 = aceptable, 3 = buena
function fuerza(pw) {
  if (!pw) return 0;
  if (pw.length < 8) return 1;
  const variedad = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  return pw.length >= 10 && variedad >= 3 ? 3 : 2;
}
const TEXTO_FUERZA = ['Mínimo 8 caracteres', 'Muy corta', 'Aceptable', 'Segura'];

export default function Registro() {
  const { usuario, registrarse } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
  const nivel = fuerza(form.password);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const datos = { ...form, semestre: form.semestre === '' ? null : Number(form.semestre) };
      const u = await registrarse(datos);
      // Un tutor nuevo primero debe registrar sus materias y horarios
      const destino = u.roles.includes('tutor') ? '/perfil-tutor' : location.state?.desde || '/panel';
      navigate(destino, { replace: true });
    } catch (ex) {
      setError(ex);
      setEnviando(false);
    }
  };

  const esTutor = form.rol === 'tutor';

  return (
    <AuthLayout
      titulo={esTutor ? 'Comparte lo que sabes y construye tu reputación' : 'Aprende con compañeros que ya pasaron por ahí'}
      puntos={
        esTutor
          ? ['Elige las materias que dominas y tu nivel', 'Define tus horarios disponibles', 'Acepta solo las solicitudes que te sirven']
          : ['Pide ayuda en cualquier materia', 'Recibe tutores sugeridos por afinidad', 'Califica cada sesión y sigue tu progreso']
      }
    >
      <form className="formulario" onSubmit={enviar} noValidate>
        <div className="apilado">
          <h1>Crear cuenta</h1>
          <p className="texto-suave">Únete a SkillSwap en menos de un minuto.</p>
        </div>

        {/* El 409 (email repetido) se muestra junto al campo email */}
        <MensajeError error={error && error.status !== 409 ? error : null} />

        <fieldset className="selector-rol">
          <legend className="campo-label">¿Cómo vas a usar SkillSwap?</legend>
          {ROLES.map(({ valor, titulo, texto, Icono }) => (
            <label key={valor} className={form.rol === valor ? 'opcion-rol activa' : 'opcion-rol'}>
              <input type="radio" name="rol" value={valor} checked={form.rol === valor} onChange={cambiar} />
              <Icono size={22} aria-hidden="true" />
              <span className="apilado" style={{ gap: 0 }}>
                <strong>{titulo}</strong>
                <span>{texto}</span>
              </span>
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
          <span className="input-con-icono">
            <Mail size={17} aria-hidden="true" />
            <input name="email" type="email" autoComplete="email" value={form.email} onChange={cambiar} />
          </span>
        </Campo>

        <Campo label="Contraseña" error={err('password')}>
          <InputPassword value={form.password} onChange={cambiar} autoComplete="new-password" />
          <span className="fuerza" data-nivel={nivel} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="campo-ayuda">{TEXTO_FUERZA[nivel]}</span>
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

        <button type="submit" className="btn btn-primario btn-lg btn-bloque" disabled={enviando}>
          <UserPlus size={18} /> {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="auth-pie">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" state={location.state}>
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
