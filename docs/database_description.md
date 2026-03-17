# Database Description - SkillSwap

## Overview

SkillSwap es una plataforma diseñada para conectar estudiantes universitarios que necesitan apoyo académico con estudiantes de semestres superiores que pueden ofrecer tutorías.

La base de datos está diseñada para gestionar:

* Usuarios del sistema
* Tutores y estudiantes
* Materias académicas
* Tutorías
* Evaluaciones
* Disponibilidad de tutores
* Progreso académico

El objetivo es facilitar la organización de sesiones de estudio de manera rápida, segura y estructurada.

---

# Main Entities

## Users

La tabla **users** almacena la información básica de todos los usuarios de la plataforma, incluyendo estudiantes y tutores.

Campos principales:

* user_id
* name
* email
* password
* role
* created_at

---

## Students

La tabla **students** representa a los estudiantes que solicitan tutorías dentro de la plataforma.

Campos principales:

* student_id
* user_id
* semester
* career

---

## Tutors

La tabla **tutors** contiene los estudiantes que ofrecen tutorías a otros alumnos.

Campos principales:

* tutor_id
* user_id
* rating
* experience_level

---

## Subjects

La tabla **subjects** almacena las materias académicas disponibles para tutorías.

Campos principales:

* subject_id
* subject_name
* description

---

## Tutor Subjects

Relaciona tutores con las materias que pueden enseñar.

Campos principales:

* tutor_subject_id
* tutor_id
* subject_id

---

## Sessions

La tabla **sessions** registra las sesiones de tutoría entre estudiantes y tutores.

Campos principales:

* session_id
* student_id
* tutor_id
* subject_id
* session_date
* duration
* status

---

## Availability

La tabla **availability** almacena los horarios disponibles de los tutores.

Campos principales:

* availability_id
* tutor_id
* day_of_week
* start_time
* end_time

---

## Reviews

La tabla **reviews** permite a los estudiantes calificar a los tutores después de una sesión.

Campos principales:

* review_id
* session_id
* rating
* comment
* created_at

---

# Database Relationships

La base de datos sigue un modelo relacional donde:

* Un **usuario** puede ser estudiante o tutor.
* Un **tutor** puede enseñar múltiples materias.
* Un **estudiante** puede reservar múltiples sesiones.
* Cada **sesión** está asociada a un tutor, estudiante y materia.
* Después de cada sesión, se puede generar una **reseña**.

Estas relaciones permiten mantener la integridad de los datos y facilitar la gestión de tutorías dentro de la plataforma.

---

# Conclusion

La estructura de la base de datos de SkillSwap permite gestionar eficientemente la interacción entre estudiantes y tutores, garantizando una experiencia organizada para el intercambio de conocimiento académico.

