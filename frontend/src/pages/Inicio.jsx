import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PASOS = [
  { n: '1', titulo: 'Pide ayuda', texto: 'Elige la materia y cuéntanos en qué necesitas apoyo.' },
  { n: '2', titulo: 'Te conectamos', texto: 'Sugerimos tutores según su nivel, reputación y horarios.' },
  { n: '3', titulo: 'Aprende y califica', texto: 'Asiste a la sesión y califica al tutor para ayudar a otros.' },
];

export default function Inicio() {
  const { usuario } = useAuth();
  if (usuario) return <Navigate to="/panel" replace />;

  return (
    <div className="inicio">
      <section className="hero">
        <img src="/logo-icono.png" alt="" className="hero-logo" width="104" height="104" />
        <p className="hero-eyebrow">Tutorías entre estudiantes</p>
        <h1>Aprende de quienes ya pasaron por ahí</h1>
        <p className="hero-texto">
          SkillSwap conecta a estudiantes que necesitan apoyo con compañeros de semestres superiores que
          pueden enseñar. Más aprendizaje, menos deserción.
        </p>
        <div className="hero-acciones">
          <Link to="/registro" className="btn btn-primario btn-lg">
            Crear cuenta gratis
          </Link>
          <Link to="/login" className="btn btn-secundario btn-lg">
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section className="pasos" aria-label="Cómo funciona">
        {PASOS.map((p) => (
          <article key={p.n} className="tarjeta paso">
            <span className="paso-num">{p.n}</span>
            <h2>{p.titulo}</h2>
            <p>{p.texto}</p>
          </article>
        ))}
      </section>

      <section className="tarjeta cta-tutor">
        <div>
          <h2>¿Vas en semestres avanzados?</h2>
          <p>Regístrate como tutor, comparte lo que sabes y construye tu reputación.</p>
        </div>
        <Link to="/registro?rol=tutor" className="btn btn-primario">
          Quiero ser tutor
        </Link>
      </section>
    </div>
  );
}
