import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  CircleCheck,
  GraduationCap,
  HeartHandshake,
  Search,
  Sparkles,
  Star,
  Video,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCarga } from '../hooks/useCarga';
import { BarraProgreso, FechaTile } from '../components/ui';
import { agruparPorArea } from '../utils/areas';

const PASOS = [
  {
    Icono: Search,
    titulo: 'Pide ayuda',
    texto: 'Elige la materia y cuenta en qué necesitas apoyo: un tema, un parcial, un trabajo.',
  },
  {
    Icono: Sparkles,
    titulo: 'Te conectamos',
    texto: 'Sugerimos tutores según su nivel en la materia, su reputación y si tienen horarios registrados.',
  },
  {
    Icono: CalendarCheck,
    titulo: 'Aprende y califica',
    texto: 'El tutor programa la sesión, virtual o presencial. Al terminar, la calificas para ayudar a otros.',
  },
];

const PREGUNTAS = [
  {
    p: '¿Quién puede ser tutor?',
    r: 'Cualquier estudiante que se registre como tutor y agregue las materias que domina, con su nivel. Registrar horarios disponibles mejora su posición en las sugerencias.',
  },
  {
    p: '¿Cómo se eligen los tutores sugeridos?',
    r: 'Cada tutor recibe un puntaje de afinidad: la mitad depende de su reputación, una parte de su nivel en la materia y otra de si tiene horarios registrados.',
  },
  {
    p: '¿Las sesiones son virtuales o presenciales?',
    r: 'Ambas. El tutor elige la modalidad, la fecha y la duración (de 30 minutos a 4 horas) al aceptar la solicitud.',
  },
  {
    p: '¿Puedo cancelar una sesión?',
    r: 'Sí, mientras esté programada. Si la cancela el tutor, tu solicitud vuelve a quedar disponible para que otro tutor la tome.',
  },
  {
    p: '¿Cómo se calcula la reputación?',
    r: 'Es el promedio de las calificaciones de 1 a 5 estrellas que dan los estudiantes después de cada sesión completada.',
  },
];

function VistaPrevia() {
  // Ilustración de la interfaz (no son datos reales)
  const enDosDias = new Date(Date.now() + 2 * 86400000).toISOString();
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="mock">
        <p className="mock-etiqueta">Tutor sugerido</p>
        <div className="fila">
          <span className="avatar avatar-md avatar-g3">AR</span>
          <div className="apilado" style={{ flex: 1 }}>
            <span className="titulo-item">Andrea R.</span>
            <span className="meta">
              <span>
                <Star size={13} fill="currentColor" style={{ color: 'var(--estrella)' }} /> 4.9
              </span>
              <span>Ingeniería · sem. 8</span>
            </span>
          </div>
        </div>
        <div className="match" style={{ marginTop: '0.8rem' }}>
          <BarraProgreso valor={92} degradado etiqueta="Afinidad" />
          <span className="match-num">92%</span>
        </div>
      </div>
      <div className="mock">
        <p className="mock-etiqueta">Tu próxima sesión</p>
        <div className="fila">
          <FechaTile iso={enDosDias} />
          <div className="apilado">
            <span className="titulo-item">Cálculo Diferencial</span>
            <span className="meta">
              <span>4:00 – 5:30 p. m.</span>
              <span>
                <Video size={13} /> Virtual
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="mock">
        <p className="mock-etiqueta">Al terminar, califica la sesión</p>
        <div className="fila" style={{ color: 'var(--estrella)' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={18} fill="currentColor" />
          ))}
          <span className="texto-suave" style={{ marginLeft: '0.4rem' }}>
            Excelente
          </span>
        </div>
      </div>
      <p className="texto-suave" style={{ textAlign: 'center', fontSize: '0.78rem' }}>
        Ilustración de la plataforma
      </p>
    </div>
  );
}

export default function Inicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [materia, setMateria] = useState('');
  const materias = useCarga(() => api('/materias'), []);
  const cifras = useCarga(() => api('/estadisticas'), []);

  if (usuario) return <Navigate to="/panel" replace />;

  const areas = agruparPorArea(materias.data?.materias ?? []);
  const e = cifras.data?.estadisticas;

  const buscar = (ev) => {
    ev.preventDefault();
    navigate(materia ? `/tutores?materia=${materia}` : '/tutores');
  };

  // Solo se muestran cifras reales y mayores que cero
  const datos = [
    e && { valor: e.materias, etiqueta: 'materias disponibles' },
    areas.length > 0 && { valor: areas.length, etiqueta: 'áreas de conocimiento' },
    e?.tutores > 0 && { valor: e.tutores, etiqueta: e.tutores === 1 ? 'tutor activo' : 'tutores activos' },
    e?.sesiones_completadas > 0 && { valor: e.sesiones_completadas, etiqueta: 'sesiones completadas' },
    e?.calificacion_promedio && { valor: `${Number(e.calificacion_promedio).toFixed(1)} ★`, etiqueta: 'calificación promedio' },
  ].filter(Boolean);

  return (
    <>
      <div className="hero-fondo">
        <section className="hero">
          <div className="hero-texto">
            <span className="eyebrow">
              <GraduationCap size={15} /> Tutorías entre estudiantes
            </span>
            <h1>
              Aprende con compañeros que <span className="resaltado">ya dominaron</span> la materia
            </h1>
            <p className="hero-sub">
              SkillSwap conecta a quienes necesitan apoyo con estudiantes de semestres superiores que pueden
              enseñar. Más aprendizaje, menos deserción.
            </p>

            <form className="buscador-hero" onSubmit={buscar} role="search">
              <select aria-label="Materia" value={materia} onChange={(ev) => setMateria(ev.target.value)}>
                <option value="">¿En qué materia necesitas ayuda?</option>
                {areas.map((a) => (
                  <optgroup key={a.clave} label={a.nombre}>
                    {a.materias.map((m) => (
                      <option key={m.id_materia} value={m.id_materia}>
                        {m.nombre_materia}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button type="submit" className="btn btn-primario btn-lg">
                <Search size={18} /> Buscar tutores
              </button>
            </form>

            <div className="hero-confianza">
              <span>
                <CircleCheck size={16} /> Tutores sugeridos por afinidad
              </span>
              <span>
                <CircleCheck size={16} /> Sesiones virtuales o presenciales
              </span>
              <span>
                <CircleCheck size={16} /> Reputación basada en calificaciones
              </span>
            </div>
          </div>
          <VistaPrevia />
        </section>
      </div>

      {datos.length > 0 && (
        <section className="cifras" aria-label="SkillSwap en cifras">
          <div className="cifras-inner">
            {datos.map((d) => (
              <div key={d.etiqueta}>
                <p className="cifra-valor">{d.valor}</p>
                <p className="cifra-etiqueta">{d.etiqueta}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {areas.length > 0 && (
        <section className="landing-seccion">
          <div className="landing-seccion-titulo">
            <span className="eyebrow">Áreas</span>
            <h2>Apoyo en materias de todas las carreras</h2>
            <p className="texto-suave">Desde cálculo y programación hasta derecho, psicología o idiomas.</p>
          </div>
          <div className="areas-grid">
            {areas.map(({ clave, nombre, Icono, tono, materias: lista }) => (
              <Link
                key={clave}
                to={`/tutores?area=${clave}`}
                className="tarjeta tarjeta-interactiva area-tarjeta"
              >
                <span className={`area-icono area-${tono}`} aria-hidden="true">
                  <Icono size={20} />
                </span>
                <span className="apilado">
                  <span className="titulo-item">{nombre}</span>
                  <span className="texto-suave">
                    {lista.length} materia{lista.length === 1 ? '' : 's'}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="landing-seccion" id="como-funciona">
        <div className="landing-seccion-titulo">
          <span className="eyebrow">Cómo funciona</span>
          <h2>De la duda a la sesión en tres pasos</h2>
        </div>
        <div className="pasos">
          {PASOS.map(({ Icono, titulo, texto }, i) => (
            <article key={titulo} className="tarjeta paso">
              <span className="paso-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="paso-icono" aria-hidden="true">
                <Icono size={24} />
              </span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-seccion" id="tutores">
        <div className="publicos">
          <article className="tarjeta publico-tarjeta">
            <span className="paso-icono" aria-hidden="true">
              <GraduationCap size={24} />
            </span>
            <h2>Para estudiantes</h2>
            <ul className="lista-check">
              <li>
                <CircleCheck size={18} /> Pide ayuda en cualquier materia del catálogo
              </li>
              <li>
                <CircleCheck size={18} /> Recibe tutores sugeridos con su porcentaje de afinidad
              </li>
              <li>
                <CircleCheck size={18} /> Sigue tus sesiones y tu progreso por materia
              </li>
            </ul>
            <Link to="/registro" className="btn btn-primario" style={{ alignSelf: 'flex-start' }}>
              Empezar como estudiante <ArrowRight size={16} />
            </Link>
          </article>
          <article className="tarjeta publico-tarjeta oscura">
            <span className="paso-icono" aria-hidden="true" style={{ background: 'rgb(255 255 255 / 12%)', color: '#fff' }}>
              <HeartHandshake size={24} />
            </span>
            <h2>Para tutores</h2>
            <ul className="lista-check">
              <li>
                <CircleCheck size={18} /> Enseña las materias que dominas, con tu nivel
              </li>
              <li>
                <CircleCheck size={18} /> Define tus horarios y acepta solo lo que te sirve
              </li>
              <li>
                <CircleCheck size={18} /> Construye tu reputación con cada sesión
              </li>
            </ul>
            <Link to="/registro?rol=tutor" className="btn btn-claro" style={{ alignSelf: 'flex-start' }}>
              Quiero ser tutor <ArrowRight size={16} />
            </Link>
          </article>
        </div>
      </section>

      <section className="landing-seccion" id="preguntas">
        <div className="landing-seccion-titulo">
          <span className="eyebrow">Preguntas frecuentes</span>
          <h2>Lo que suelen preguntarnos</h2>
        </div>
        <div className="faq">
          {PREGUNTAS.map(({ p, r }) => (
            <details key={p}>
              <summary>
                {p} <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>{r}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="cta-final">
        <img src="/logo-icono.png" alt="" className="hero-logo" width="64" height="64" />
        <h2>¿Listo para aprender o enseñar?</h2>
        <p>Crea tu cuenta en menos de un minuto y empieza hoy mismo.</p>
        <div className="acciones" style={{ justifyContent: 'center' }}>
          <Link to="/registro" className="btn btn-claro btn-lg">
            Crear cuenta
          </Link>
          <Link to="/registro?rol=tutor" className="btn btn-lg" style={{ color: '#fff', borderColor: 'rgb(255 255 255 / 35%)' }}>
            Soy tutor
          </Link>
        </div>
      </section>
    </>
  );
}
