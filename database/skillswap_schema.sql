-- =========================================
-- CREAR BASE DE DATOS
-- =========================================
CREATE DATABASE IF NOT EXISTS skillswap;
USE skillswap;

-- =========================================
-- UNIVERSIDADES
-- =========================================
CREATE TABLE universidades (
    id_universidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre_universidad VARCHAR(150) NOT NULL
);

-- =========================================
-- CAMPUS
-- =========================================
CREATE TABLE campus (
    id_campus INT AUTO_INCREMENT PRIMARY KEY,
    nombre_campus VARCHAR(100),
    id_universidad INT,
    FOREIGN KEY (id_universidad) REFERENCES universidades(id_universidad)
);

-- =========================================
-- AULAS
-- =========================================
CREATE TABLE aulas (
    id_aula INT AUTO_INCREMENT PRIMARY KEY,
    nombre_aula VARCHAR(100),
    id_campus INT,
    FOREIGN KEY (id_campus) REFERENCES campus(id_campus)
);

-- =========================================
-- FACULTADES
-- =========================================
CREATE TABLE facultades (
    id_facultad INT AUTO_INCREMENT PRIMARY KEY,
    nombre_facultad VARCHAR(100)
);

-- =========================================
-- CARRERAS
-- =========================================
CREATE TABLE carreras (
    id_carrera INT AUTO_INCREMENT PRIMARY KEY,
    nombre_carrera VARCHAR(100),
    id_facultad INT,
    FOREIGN KEY (id_facultad) REFERENCES facultades(id_facultad)
);

-- =========================================
-- ROLES
-- =========================================
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50)
);

-- =========================================
-- USUARIOS
-- =========================================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    carrera VARCHAR(100),
    semestre INT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- USUARIO_ROL
-- =========================================
CREATE TABLE usuario_rol (
    id_usuario INT,
    id_rol INT,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- =========================================
-- ESTUDIANTES
-- =========================================
CREATE TABLE estudiantes (
    id_estudiante INT PRIMARY KEY,
    FOREIGN KEY (id_estudiante) REFERENCES usuarios(id_usuario)
);

-- =========================================
-- TUTORES
-- =========================================
CREATE TABLE tutores (
    id_tutor INT PRIMARY KEY,
    reputacion_promedio DECIMAL(2,1),
    total_tutorias INT DEFAULT 0,
    FOREIGN KEY (id_tutor) REFERENCES usuarios(id_usuario)
);

-- =========================================
-- MATERIAS
-- =========================================
CREATE TABLE materias (
    id_materia INT AUTO_INCREMENT PRIMARY KEY,
    nombre_materia VARCHAR(100),
    codigo_materia VARCHAR(50)
);

-- =========================================
-- USUARIO_MATERIA
-- =========================================
CREATE TABLE usuario_materia (
    id_usuario INT,
    id_materia INT,
    nivel VARCHAR(50),
    PRIMARY KEY (id_usuario, id_materia),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia)
);

-- =========================================
-- DISPONIBILIDAD TUTOR
-- =========================================
CREATE TABLE disponibilidad_tutor (
    id_disponibilidad INT AUTO_INCREMENT PRIMARY KEY,
    id_tutor INT,
    dia_semana VARCHAR(20),
    hora_inicio TIME,
    hora_fin TIME,
    FOREIGN KEY (id_tutor) REFERENCES tutores(id_tutor)
);

-- =========================================
-- SOLICITUDES TUTORIA
-- =========================================
CREATE TABLE solicitudes_tutoria (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT,
    id_materia INT,
    descripcion TEXT,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50),
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante),
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia)
);

-- =========================================
-- MATCHING TUTOR
-- =========================================
CREATE TABLE matching_tutor (
    id_matching INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT,
    id_tutor INT,
    puntaje_match DECIMAL(3,2),
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes_tutoria(id_solicitud),
    FOREIGN KEY (id_tutor) REFERENCES tutores(id_tutor)
);

-- =========================================
-- SESIONES TUTORIA
-- =========================================
CREATE TABLE sesiones_tutoria (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud INT,
    id_tutor INT,
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    modalidad VARCHAR(50),
    estado VARCHAR(50),
    FOREIGN KEY (id_solicitud) REFERENCES solicitudes_tutoria(id_solicitud),
    FOREIGN KEY (id_tutor) REFERENCES tutores(id_tutor)
);

-- =========================================
-- HISTORIAL TUTORIAS
-- =========================================
CREATE TABLE historial_tutorias (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_sesion INT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sesion) REFERENCES sesiones_tutoria(id_sesion)
);

-- =========================================
-- CALIFICACIONES
-- =========================================
CREATE TABLE calificaciones (
    id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_sesion INT,
    puntuacion INT,
    comentario TEXT,
    FOREIGN KEY (id_sesion) REFERENCES sesiones_tutoria(id_sesion)
);

-- =========================================
-- PROGRESO ESTUDIANTE
-- =========================================
CREATE TABLE progreso_estudiante (
    id_progreso INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT,
    id_materia INT,
    sesiones_completadas INT DEFAULT 0,
    FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id_estudiante),
    FOREIGN KEY (id_materia) REFERENCES materias(id_materia)
);

-- =========================================
-- NOTIFICACIONES
-- =========================================
CREATE TABLE notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    mensaje TEXT,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- =========================================
-- MENSAJES
-- =========================================
CREATE TABLE mensajes (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_remitente INT,
    id_destinatario INT,
    contenido TEXT,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_remitente) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario)
);

-- =========================================
-- ARCHIVOS COMPARTIDOS
-- =========================================
CREATE TABLE archivos_compartidos (
    id_archivo INT AUTO_INCREMENT PRIMARY KEY,
    id_sesion INT,
    nombre_archivo VARCHAR(255),
    url_archivo TEXT,
    FOREIGN KEY (id_sesion) REFERENCES sesiones_tutoria(id_sesion)
);

-- =========================================
-- REPORTES
-- =========================================
CREATE TABLE reportes (
    id_reporte INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    motivo TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- =========================================
-- LOG SISTEMA
-- =========================================
CREATE TABLE log_sistema (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    accion VARCHAR(255),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CONFIGURACIONES
-- =========================================
CREATE TABLE configuraciones (
    id_config INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100),
    valor VARCHAR(255)
);
