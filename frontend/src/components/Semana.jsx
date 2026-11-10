import { X } from 'lucide-react';

export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const CORTO = { lunes: 'Lun', martes: 'Mar', miércoles: 'Mié', jueves: 'Jue', viernes: 'Vie', sábado: 'Sáb', domingo: 'Dom' };

// Vista semanal de las franjas de disponibilidad. Con onQuitar, cada franja
// muestra un botón para eliminarla (perfil del propio tutor).
export default function Semana({ disponibilidad = [], onQuitar }) {
  return (
    <div className="semana">
      {DIAS.map((dia) => {
        const franjas = disponibilidad.filter((d) => d.dia_semana === dia);
        return (
          <div key={dia} className="semana-dia">
            <span className="semana-dia-nombre">{CORTO[dia]}</span>
            {franjas.length === 0 ? (
              <span className="texto-suave" style={{ fontSize: '0.72rem', textAlign: 'center' }}>
                —
              </span>
            ) : (
              franjas.map((f) => (
                <span key={f.id_disponibilidad} className="franja">
                  {f.hora_inicio}
                  <br />
                  {f.hora_fin}
                  {onQuitar && (
                    <button
                      type="button"
                      aria-label={`Quitar ${dia} ${f.hora_inicio} a ${f.hora_fin}`}
                      onClick={() => onQuitar(f)}
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
