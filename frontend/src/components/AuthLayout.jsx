import { useState } from 'react';
import { CircleCheck, Eye, EyeOff, Lock } from 'lucide-react';

// Contenedor de dos columnas para inicio de sesión y registro
export default function AuthLayout({ titulo, puntos, children }) {
  return (
    <div className="auth">
      <aside className="auth-panel">
        <img src="/logo-icono.png" alt="" width="56" height="56" />
        <div className="apilado" style={{ gap: '1.25rem' }}>
          <h2>{titulo}</h2>
          <ul className="lista-check">
            {puntos.map((p) => (
              <li key={p}>
                <CircleCheck size={18} /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="auth-panel-pie">SkillSwap · Conectando conocimiento estudiantil</p>
      </aside>
      <div className="auth-form">{children}</div>
    </div>
  );
}

// Campo de contraseña con botón para mostrarla u ocultarla
export function InputPassword({ value, onChange, autoComplete, name = 'password' }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="input-con-icono">
      <Lock size={17} aria-hidden="true" />
      <input
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="icono-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </span>
  );
}
