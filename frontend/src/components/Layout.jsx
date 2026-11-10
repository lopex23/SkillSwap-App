import { startTransition, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function enlacesPara(tieneRol) {
  const enlaces = [{ to: '/panel', texto: 'Inicio' }];
  if (tieneRol('estudiante')) {
    enlaces.push(
      { to: '/solicitudes/nueva', texto: 'Pedir tutoría' },
      { to: '/solicitudes', texto: 'Mis solicitudes', end: true },
      { to: '/progreso', texto: 'Mi progreso' }
    );
  }
  if (tieneRol('tutor')) {
    enlaces.push(
      { to: '/disponibles', texto: 'Solicitudes disponibles' },
      { to: '/perfil-tutor', texto: 'Mi perfil de tutor' }
    );
  }
  enlaces.push({ to: '/sesiones', texto: 'Mis sesiones' }, { to: '/tutores', texto: 'Tutores' });
  if (tieneRol('administrador')) enlaces.push({ to: '/admin/materias', texto: 'Materias' });
  return enlaces;
}

export default function Layout() {
  const { usuario, tieneRol, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  // React Router aplica la navegación dentro de una transición. Si el cierre de
  // sesión se aplicara antes, RutaProtegida redirigiría a /login en vez de "/".
  // Por eso ambos cambios van en la misma transición.
  const salir = () => {
    setMenuAbierto(false);
    navigate('/');
    startTransition(() => cerrarSesion());
  };

  return (
    <div className="app">
      <header className="cabecera">
        <div className="cabecera-inner">
          <Link to={usuario ? '/panel' : '/'} className="marca" onClick={() => setMenuAbierto(false)}>
            <img src="/logo-icono.png" alt="" className="marca-logo" width="36" height="36" />
            <span className="marca-texto">
              <span className="marca-skill">Skill</span>
              <span className="marca-swap">Swap</span>
            </span>
          </Link>

          {usuario ? (
            <>
              <button
                type="button"
                className="menu-toggle"
                aria-expanded={menuAbierto}
                aria-controls="nav-principal"
                onClick={() => setMenuAbierto((v) => !v)}
              >
                {menuAbierto ? 'Cerrar' : 'Menú'}
              </button>
              <nav id="nav-principal" className={menuAbierto ? 'nav abierto' : 'nav'}>
                {enlacesPara(tieneRol).map((e) => (
                  <NavLink key={e.to} to={e.to} end={e.end} onClick={() => setMenuAbierto(false)}>
                    {e.texto}
                  </NavLink>
                ))}
                <div className="nav-usuario">
                  <span className="nav-nombre">
                    {usuario.nombre} <span className="texto-suave">· {usuario.roles.join(', ')}</span>
                  </span>
                  <button type="button" className="btn btn-sm btn-secundario" onClick={salir}>
                    Salir
                  </button>
                </div>
              </nav>
            </>
          ) : (
            <nav className="nav nav-publica">
              <NavLink to="/login">Iniciar sesión</NavLink>
              <Link to="/registro" className="btn btn-sm btn-primario">
                Crear cuenta
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="contenido">
        <Outlet />
      </main>

      <footer className="pie">SkillSwap · Conectando conocimiento estudiantil</footer>
    </div>
  );
}
