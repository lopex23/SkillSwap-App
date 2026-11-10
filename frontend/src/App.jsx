import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RutaProtegida from './components/RutaProtegida';
import { Vacio } from './components/ui';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Panel from './pages/Panel';
import PedirTutoria from './pages/PedirTutoria';
import MisSolicitudes from './pages/MisSolicitudes';
import SolicitudDetalle from './pages/SolicitudDetalle';
import Disponibles from './pages/Disponibles';
import Sesiones from './pages/Sesiones';
import PerfilTutor from './pages/PerfilTutor';
import Tutores from './pages/Tutores';
import TutorDetalle from './pages/TutorDetalle';
import Progreso from './pages/Progreso';
import AdminMaterias from './pages/AdminMaterias';

const protegida = (elemento, roles) => <RutaProtegida roles={roles}>{elemento}</RutaProtegida>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Registro />} />

        <Route path="panel" element={protegida(<Panel />)} />
        <Route path="sesiones" element={protegida(<Sesiones />)} />
        <Route path="tutores" element={protegida(<Tutores />)} />
        <Route path="tutores/:id" element={protegida(<TutorDetalle />)} />
        <Route path="solicitudes/:id" element={protegida(<SolicitudDetalle />)} />

        <Route path="solicitudes" element={protegida(<MisSolicitudes />, ['estudiante'])} />
        <Route path="solicitudes/nueva" element={protegida(<PedirTutoria />, ['estudiante'])} />
        <Route path="progreso" element={protegida(<Progreso />, ['estudiante'])} />

        <Route path="disponibles" element={protegida(<Disponibles />, ['tutor'])} />
        <Route path="perfil-tutor" element={protegida(<PerfilTutor />, ['tutor'])} />

        <Route path="admin/materias" element={protegida(<AdminMaterias />, ['administrador'])} />

        <Route
          path="*"
          element={
            <Vacio titulo="Página no encontrada">
              <Link to="/">Volver al inicio</Link>
            </Vacio>
          }
        />
      </Route>
    </Routes>
  );
}
