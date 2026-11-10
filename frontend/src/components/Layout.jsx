import { startTransition, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  ChartColumn,
  CirclePlus,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';
import { capitalizar } from '../utils/formato';

function Marca({ to = '/' }) {
  return (
    <Link to={to} className="marca">
      <img src="/logo-icono.png" alt="" className="marca-logo" width="36" height="36" />
      <span className="marca-texto">
        <span className="marca-skill">Skill</span>
        <span className="marca-swap">Swap</span>
      </span>
    </Link>
  );
}

// Grupos de navegación según los roles del usuario
function secciones(tieneRol, cuentas) {
  const grupos = [
    {
      titulo: null,
      enlaces: [
        { to: '/panel', texto: 'Inicio', Icono: LayoutDashboard },
        { to: '/sesiones', texto: 'Mis sesiones', Icono: CalendarDays, cuenta: cuentas.programadas },
        { to: '/tutores', texto: 'Explorar tutores', Icono: Users },
      ],
    },
  ];
  if (tieneRol('estudiante')) {
    grupos.push({
      titulo: 'Aprender',
      enlaces: [
        { to: '/solicitudes/nueva', texto: 'Pedir tutoría', Icono: CirclePlus },
        { to: '/solicitudes', texto: 'Mis solicitudes', Icono: ClipboardList, end: true, cuenta: cuentas.pendientes },
        { to: '/progreso', texto: 'Mi progreso', Icono: ChartColumn },
      ],
    });
  }
  if (tieneRol('tutor')) {
    grupos.push({
      titulo: 'Enseñar',
      enlaces: [
        { to: '/disponibles', texto: 'Solicitudes', Icono: Inbox, cuenta: cuentas.disponibles, destacar: true },
        { to: '/perfil-tutor', texto: 'Mi perfil de tutor', Icono: UserCog },
      ],
    });
  }
  if (tieneRol('administrador')) {
    grupos.push({ titulo: 'Administración', enlaces: [{ to: '/admin/materias', texto: 'Materias', Icono: BookOpen }] });
  }
  return grupos;
}

// Contadores de la barra lateral; se actualizan al cambiar de página
function useCuentas(usuario, tieneRol, ruta) {
  const [cuentas, setCuentas] = useState({});
  useEffect(() => {
    if (!usuario) return;
    let vigente = true;
    Promise.all([
      api('/sesiones/mias?estado=programada').catch(() => null),
      tieneRol('estudiante') ? api('/solicitudes/mias?estado=pendiente').catch(() => null) : null,
      tieneRol('tutor') ? api('/solicitudes/disponibles').catch(() => null) : null,
    ]).then(([s, p, d]) => {
      if (!vigente) return;
      setCuentas({
        programadas: s?.sesiones.length || 0,
        pendientes: p?.solicitudes.length || 0,
        disponibles: d?.solicitudes.length || 0,
      });
    });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id_usuario, ruta]);
  return cuentas;
}

function AppShell() {
  const { usuario, tieneRol, cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const cuentas = useCuentas(usuario, tieneRol, pathname);

  // Cerrar el menú móvil al navegar
  useEffect(() => setAbierto(false), [pathname]);

  // React Router aplica la navegación dentro de una transición. Si el cierre de
  // sesión se aplicara antes, RutaProtegida redirigiría a /login en vez de "/".
  const salir = () => {
    navigate('/');
    startTransition(() => cerrarSesion());
  };

  return (
    <div className={abierto ? 'shell menu-abierto' : 'shell'}>
      <aside className="sidebar" id="sidebar" aria-label="Navegación principal">
        <div className="sidebar-cabecera">
          <Marca to="/panel" />
          <button type="button" className="icono-btn solo-movil" aria-label="Cerrar menú" onClick={() => setAbierto(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {secciones(tieneRol, cuentas).map((g) => (
            <div key={g.titulo || 'general'} className="nav-grupo">
              {g.titulo && <p className="nav-grupo-titulo">{g.titulo}</p>}
              {g.enlaces.map(({ to, texto, Icono, end, cuenta, destacar }) => (
                <NavLink key={to} to={to} end={end} className="nav-item">
                  <Icono size={19} aria-hidden="true" />
                  <span>{texto}</span>
                  {cuenta > 0 && (
                    <span className={destacar ? 'nav-cuenta destacada' : 'nav-cuenta'} aria-label={`${cuenta} pendientes`}>
                      {cuenta}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {tieneRol('estudiante') && (
          <Link to="/solicitudes/nueva" className="sidebar-cta">
            <span className="sidebar-cta-titulo">¿Atascado en una materia?</span>
            <span className="sidebar-cta-texto">Pide una tutoría y te sugerimos tutores.</span>
          </Link>
        )}

        <div className="sidebar-usuario">
          <Avatar persona={usuario} id={usuario.id_usuario} />
          <div className="sidebar-usuario-datos">
            <p className="sidebar-usuario-nombre">
              {usuario.nombre} {usuario.apellido}
            </p>
            <p className="sidebar-usuario-rol">{usuario.roles.map(capitalizar).join(' · ')}</p>
          </div>
          <button type="button" className="icono-btn" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <div className="sidebar-fondo" onClick={() => setAbierto(false)} aria-hidden="true" />

      <div className="shell-main">
        <header className="topbar">
          <button
            type="button"
            className="icono-btn"
            aria-label="Abrir menú"
            aria-controls="sidebar"
            aria-expanded={abierto}
            onClick={() => setAbierto(true)}
          >
            <Menu size={22} />
          </button>
          <Marca to="/panel" />
          <Avatar persona={usuario} id={usuario.id_usuario} tamano="sm" />
        </header>
        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PublicShell() {
  return (
    <div className="publico">
      <header className="cabecera-publica">
        <div className="cabecera-inner">
          <Marca />
          <nav className="nav-publica" aria-label="Principal">
            <a href="/#como-funciona" className="ocultar-movil">
              Cómo funciona
            </a>
            <a href="/#tutores" className="ocultar-movil">
              Ser tutor
            </a>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/registro" className="btn btn-sm btn-primario">
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main className="contenido-publico">
        <Outlet />
      </main>

      <footer className="pie">
        <div className="pie-inner">
          <div className="pie-marca">
            <Marca />
            <p className="texto-suave">
              Conectando conocimiento estudiantil: tutorías entre compañeros para aprender más y abandonar menos.
            </p>
          </div>
          <div className="pie-columna">
            <p className="pie-titulo">Plataforma</p>
            <Link to="/registro">Pedir una tutoría</Link>
            <Link to="/registro?rol=tutor">Ser tutor</Link>
            <Link to="/login">Iniciar sesión</Link>
          </div>
          <div className="pie-columna">
            <p className="pie-titulo">Conoce más</p>
            <a href="/#como-funciona">Cómo funciona</a>
            <a href="/#preguntas">Preguntas frecuentes</a>
          </div>
        </div>
        <p className="pie-legal">© {new Date().getFullYear()} SkillSwap · Proyecto académico</p>
      </footer>
    </div>
  );
}

export default function Layout() {
  const { usuario, cargando } = useAuth();
  // Mientras se recupera la sesión guardada, evitar mostrar un instante la versión pública
  if (cargando) {
    return (
      <div className="pantalla-carga">
        <img src="/logo-icono.png" alt="" width="56" height="56" />
        <span className="spinner" aria-hidden="true" />
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }
  return usuario ? <AppShell /> : <PublicShell />;
}
