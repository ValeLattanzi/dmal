# Progress — Mejoras Web-UI para presentación

Última actualización: 2026-06-10

## Contexto general

Se está preparando la web-ui (`web-ui/`) para una demo en vivo del flujo académico completo
(definición de currícula → asignación docente → inscripción → entrega de TP → corrección →
diploma SBT) ante el profesor de la materia.

## Completado

### 1. Tabs de selección de rol más claros

- Nuevo componente `web-ui/src/components/RoleTabs.tsx`: reemplaza el `<select>` de roles del
  Header por una grilla de 4 tabs (Portal Docente, Portal Alumno, Validador, Administración),
  cada uno con icono, subtítulo descriptivo y color distintivo (indigo/cyan/emerald/amber).
- `Header.tsx`: se eliminó el selector de rol (`<select>`) y las props `currentRole`/`setCurrentRole`
  no usadas.
- `App.tsx`: se renderiza `<RoleTabs />` debajo del `<Header />` y arriba del contenido principal.

### 2. Fix del modal de Auditoría

- `AuditDashboard.tsx`: el modal usa `createPortal(..., document.body)` para evitar que el
  `backdrop-filter` (`glass`) del `<header>` lo "atrape" como containing block de `position: fixed`
  (antes aparecía como una franja arriba en vez de centrado en pantalla).

### 3. Flujo demo end-to-end (currícula → TP → calificación → diploma)

Implementado 100% en frontend/estado local (Zustand), reutilizando los métodos existentes de
`blockchainService` (`defineCurriculum`, `enrollStudent`, `submitGrade`, `hasCompletedAllSubjects`,
`mintDiploma`).

- **`types/index.ts`**: nuevos tipos `WorkSubmission` (TP entregado por el alumno) y
  `ProfessorAssignment` (subjectId → {id, name}). Se extendió `AppState`.
- **`store/appStore.ts`**:
  - `submissions: WorkSubmission[]` + `addSubmission()` + `markSubmissionGraded(id, score)`.
  - `professorAssignments` precargado con 3 docentes demo (materias 1, 2, 3).
  - `assignProfessor(subjectId, id, name)`.
  - `clearHistory()` también limpia `submissions`.
- **`AdminPortal.tsx`**:
  - Nueva pestaña "🧑‍🏫 2. Docentes" para asignar un docente (id + nombre) a cada materia
    (1, 2, 3). Es solo visual/organizativo, no llama al contrato (no existe gestión de
    docentes on-chain).
  - Pestañas renombradas/renumeradas como flujo guiado: "📚 1. Currícula" → "🧑‍🏫 2. Docentes"
    → "📝 3. Inscribir" → "🎓 Diploma" → "🔐 Recuperación".
  - Pestaña Diploma: nuevo botón "Verificar Elegibilidad (hasCompletedAllSubjects)" que
    consulta on-chain y muestra ✅/❌ antes de emitir el SBT.
- **`StudentPortal.tsx`**:
  - Nueva card "Entrega de Trabajo Práctico": selector de materia (muestra el docente
    asignado), input de título, `<input type="file" accept="application/pdf">` real
    (genera `URL.createObjectURL`), botón "Entregar Trabajo Práctico" → `addSubmission(...)`
    con `status: 'pending'`. Es solo ilustrativo, no se sube a IPFS/blockchain.
  - Nueva card "Estado de Graduación": muestra `X / 3` materias aprobadas y, si
    `hasCompletedAllSubjects(walletAddress)` devuelve `true`, un banner "🎓 ¡Elegible para
    Diploma!" con la wallet address para pasarle a Administración.
- **`ProfessorPortal.tsx`**:
  - Nueva sección "Trabajos Pendientes de Corrección": lista las `submissions` con
    `status === 'pending'`, cada una con link "Ver PDF" (abre el `fileUrl` en pestaña nueva)
    y botón "Calificar" que preselecciona la materia en el formulario de notas y hace scroll
    (`id="grade-form"`).
  - Al confirmar la nota, si había una entrega pendiente para esa materia se marca como
    `graded` con `markSubmissionGraded(id, score)`.
  - El `professorId` enviado a `submitGrade(...)` ahora sale de
    `professorAssignments[subjectId]?.id ?? 14` (antes hardcodeado a `14`).

`tsc --noEmit` pasa sin errores. Dev server (`npm run dev` en `web-ui/`) corre sin problemas
(verificado con `curl` a `http://localhost:5174/`).

## Pendiente / próximos pasos

1. **Probar el flujo completo en navegador** con MetaMask conectado (Sepolia):
   1. Admin → Currícula: definir carrera 1 con materias 1,2,3 (`defineCurriculum`).
   2. Admin → Docentes: asignar nombre/ID de docente a cada materia.
   3. Admin → Inscribir: inscribir la wallet conectada en carrera 1 (`enrollStudent`).
   4. Profesor: cargar notas ≥60 para materias 1 y 2 (preparación, deben quedar 2/3 aprobadas
      antes de la demo en vivo).
   5. Alumno: subir PDF + título para materia 3 → "Entregar Trabajo Práctico".
   6. Profesor: ver la entrega pendiente, abrir el PDF, click "Calificar" → cargar nota ≥60
      para materia 3 (`submitGrade`).
   7. Alumno: confirmar que aparece el banner "🎓 ¡Elegible para Diploma!" (3/3).
   8. Admin → Diploma: pegar la wallet, "Verificar Elegibilidad" (debe dar ✅), luego
      "Emitir Diploma SBT" (`mintDiploma`).
2. Verificar responsive (mobile 2x2 / desktop fila de 4) de `RoleTabs`.
3. Si algo falla en pasos on-chain (gas, red, contrato), revisar `direcciones.md` /
   `direcciones.txt` para confirmar que las direcciones de contrato en
   `web-ui/src/services/blockchain.ts` siguen siendo las correctas en Sepolia.
4. Cambios sin commitear (ver `git status`): `Header.tsx`, `blockchain.ts`, `appStore.ts`,
   más los archivos nuevos (`RoleTabs.tsx`) y los modificados de este flujo
   (`AdminPortal.tsx`, `StudentPortal.tsx`, `ProfessorPortal.tsx`, `AuditDashboard.tsx`,
   `types/index.ts`, `App.tsx`). Falta decidir si se commitea todo junto o se separa por feature.

## Plan original

El plan detallado de esta sesión está en
`/home/valentino/.claude/plans/quiero-que-mejores-la-wobbly-rabbit.md`.
