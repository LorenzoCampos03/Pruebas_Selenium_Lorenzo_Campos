# Módulo de Notas - Sistema de Evaluaciones

Este módulo implementa el sistema completo de gestión de notas con 3 bloques principales navegables desde tabs.

## Estructura

### Página Principal
- **NotesMainPage.jsx**: Página principal con navegación por tabs entre los 3 bloques

### Bloque 1: Evaluaciones Diarias

#### Wizard de Creación (5 pasos)
1. **Step1DateClassroom**: Selección de fecha y aula
2. **Step2SelectCourses**: Selección de cursos (máx 5)
3. **Step3SelectCompetencies**: Selección de competencias (máx 3 por curso)
4. **Step4SelectCapacities**: Selección de capacidades (1 por competencia)
5. **Step5EnterGrades**: Ingreso de notas en tabla formato MINEDU

#### Componentes
- **DailyEvaluationsTab**: Tab principal del bloque
- **DailyEvaluationListTable**: Listado de evaluaciones con acciones
- **DailyEvaluationWizard**: Wizard completo de 5 pasos
- **DailyEvaluationDetail**: Vista de detalle en modo lectura

### Bloque 2: Boleta de Notas
- **ReportCardsTab**: Redirige a la funcionalidad existente de boletas

### Bloque 3: Visualización de Promedios
- **AveragesTab**: Vista agrupada por curso con evaluaciones expandibles

## Características Principales

### Restricciones del Sistema
- Máximo 5 cursos por evaluación
- Máximo 3 competencias por curso
- 1 sola capacidad por competencia
- Notas permitidas: AD, A, B, C

### Tabla de Notas
Formato oficial del Registro de Notas del Ministerio de Educación del Perú:
- Header de 3 niveles: Curso → Competencia → Capacidad
- Columnas fijas (número y nombre) con scroll horizontal
- Header fijo con scroll vertical
- Colores diferenciados por nivel
- Dropdowns para selección de notas con colores por nivel de logro

### Estados de Evaluación
- **EN_PROCESO**: Permite editar, finalizar y eliminar
- **FINALIZADO**: Solo permite ver
- **CANCELADO**: Solo permite ver

### Acciones por Estado
- **Ver**: Disponible para todos los estados
- **Editar**: Solo EN_PROCESO
- **Finalizar**: Solo EN_PROCESO (valida que todas las notas estén completas)
- **Eliminar**: Solo EN_PROCESO

## Endpoints Utilizados

### Evaluaciones
- `POST /api/v1/evaluations` - Crear evaluación
- `GET /api/v1/evaluations/{id}` - Obtener evaluación
- `GET /api/v1/evaluations/teacher/{teacherId}/classroom/{classroomId}` - Listar por docente y aula
- `GET /api/v1/evaluations/{id}/details` - Obtener detalles
- `PUT /api/v1/evaluations/{id}/details/{detailId}` - Actualizar nota
- `PATCH /api/v1/evaluations/{id}/finalize` - Finalizar evaluación
- `DELETE /api/v1/evaluations/{id}` - Eliminar evaluación

### Datos Académicos
- `GET /api/classrooms` - Obtener aulas
- `GET /api/v1/courses/{id}` - Obtener curso
- `GET /api/v1/competencies/course/{courseId}/active` - Obtener competencias
- `GET /api/v1/capacities/competency/{competencyId}/active` - Obtener capacidades
- `GET /api/students/classroom/{classroomId}` - Obtener estudiantes

## Niveles de Logro

| Código | Descripción | Color |
|--------|-------------|-------|
| AD | Logro destacado | Verde |
| A | Logro previsto | Azul |
| B | En proceso | Amarillo |
| C | En inicio | Rojo |

## Rutas

```
/docente/notas                                    - Página principal con tabs
/docente/notas/evaluaciones-diarias/nueva         - Wizard de creación
/docente/notas/evaluaciones-diarias/:id           - Detalle de evaluación
/docente/notas/evaluaciones-diarias/:id/editar    - Edición de evaluación
```

## Estilos

Los estilos específicos para las tablas de notas están en `notes-table.css` siguiendo el formato visual del Ministerio de Educación del Perú.
