import {
  Atom,
  Brain,
  Briefcase,
  Calculator,
  ChartColumn,
  Code,
  HeartPulse,
  Languages,
  Layers,
  Megaphone,
  Microscope,
  PenTool,
  PiggyBank,
  Receipt,
  Scale,
  School,
  TrendingUp,
} from 'lucide-react';

// Área académica según el prefijo del código de materia (ej. "MAT-101" → Matemáticas).
// tono: índice de la paleta de colores de área definida en index.css (.area-0 … .area-5)
const AREAS = {
  MAT: { nombre: 'Matemáticas', Icono: Calculator, tono: 0 },
  FIS: { nombre: 'Física', Icono: Atom, tono: 0 },
  ING: { nombre: 'Ingeniería y programación', Icono: Code, tono: 0 },
  EST: { nombre: 'Estadística', Icono: ChartColumn, tono: 0 },
  ADM: { nombre: 'Administración', Icono: Briefcase, tono: 1 },
  ECO: { nombre: 'Economía', Icono: TrendingUp, tono: 1 },
  CON: { nombre: 'Contaduría', Icono: Receipt, tono: 1 },
  FIN: { nombre: 'Finanzas', Icono: PiggyBank, tono: 1 },
  DER: { nombre: 'Derecho', Icono: Scale, tono: 2 },
  PSI: { nombre: 'Psicología', Icono: Brain, tono: 3 },
  SAL: { nombre: 'Ciencias de la salud', Icono: HeartPulse, tono: 3 },
  COM: { nombre: 'Comunicación', Icono: Megaphone, tono: 4 },
  EDU: { nombre: 'Educación', Icono: School, tono: 4 },
  DIS: { nombre: 'Diseño y arquitectura', Icono: PenTool, tono: 5 },
  IDI: { nombre: 'Idiomas', Icono: Languages, tono: 5 },
  INV: { nombre: 'Investigación', Icono: Microscope, tono: 2 },
};

const OTRA = { nombre: 'Otras', Icono: Layers, tono: 2 };

export function prefijo(codigo) {
  return String(codigo || '').split('-')[0].toUpperCase();
}

export function areaDe(codigoMateria) {
  const p = prefijo(codigoMateria);
  return { clave: AREAS[p] ? p : 'OTRA', ...(AREAS[p] || OTRA) };
}

// Agrupa materias por área: [{ clave, nombre, Icono, tono, materias: [...] }]
export function agruparPorArea(materias) {
  const grupos = new Map();
  for (const m of materias) {
    const a = areaDe(m.codigo_materia);
    if (!grupos.has(a.clave)) grupos.set(a.clave, { ...a, materias: [] });
    grupos.get(a.clave).materias.push(m);
  }
  return [...grupos.values()].sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));
}
