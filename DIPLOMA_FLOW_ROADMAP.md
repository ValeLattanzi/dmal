# 🎓 Hoja de Ruta: Flujo de Emisión de Diploma

**Proyecto:** DMAL (Decentralized Music Academy Ledger)
**Versión:** 1.0
**Fecha:** 4 de Junio de 2026
**Estado:** ✅ Testeado en Remix VM

---

## 📋 Descripción General

Este documento describe el flujo completo desde la creación de una carrera hasta la emisión de un diploma Soulbound Token (SBT), incluyendo todas las validaciones, cross-contract calls, eventos y costos de gas involucrados.

**Flujo:**

```
1. Definir Carrera + Currícula
   ↓
2. Matricular Estudiante
   ↓
3. Calificar Todas las Materias
   ↓
4. Verificar Completitud
   ↓
5. Emitir Diploma SBT
```

---

## 🎯 Requisitos Previos

### Roles Necesarios

```
REGISTRAR_ROLE (Admin)     → defineCurriculum(), enrollStudent()
PROFESSOR_ROLE (Docente)   → submitGrade()
ISSUER_ROLE (Admin)        → mintDiploma()
```

### Cuentas Requeridas

```
Cuenta A: Admin (deployer)           0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
Cuenta B: Estudiante (graduado)     0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
Cuenta C: Profesor                   0x4B20993Bc481177ec7E8f571ceCAAe8A0e4Ffc45
```

### Contratos Desplegados

```
ConservatoryAcademy:  0x...academia... (desplegado primero)
ConservatoryDiploma:  0x...diploma... (referencia a Academy)
```

---

## 📍 PASO 1: Definir Carrera y Currícula

### Función

```solidity
defineCurriculum(uint256 _careerId, uint256[] calldata _subjectIds)
```

### Detalles

| Parámetro     | Tipo      | Ejemplo     | Descripción                           |
| ------------- | --------- | ----------- | ------------------------------------- |
| `_careerId`   | uint256   | `1`         | ID único de la carrera (debe ser > 0) |
| `_subjectIds` | uint256[] | `[1, 2, 3]` | Array de IDs de materias obligatorias |

### Validaciones

```javascript
✓ careerId debe ser > 0
✓ subjectIds debe ser un array no vacío
```

### Evento Emitido

```solidity
event CurriculumDefined(uint256 indexed careerId, uint256[] subjectIds)
```

### Ejecución en Remix

```javascript
// Cuenta A (Admin)
Seleccionar: ConservatoryAcademy
Función: defineCurriculum
Parámetros:
  _careerId: 1
  _subjectIds: [1, 2, 3]

✅ Tx exitosa
```

### Estado Modificado

```
ConservatoryAcademy.careerCurriculum[1] = [1, 2, 3]
```

### Gas Estimado

```
Gas Used: ~25,000 gas
Costo: ~0.5 MATIC (en Polygon Amoy con 20 gwei)
```

---

## 🎓 PASO 2: Matricular Estudiante

### Función

```solidity
enrollStudent(address _student, uint256 _careerId)
```

### Detalles

| Parámetro   | Tipo    | Ejemplo     | Descripción          |
| ----------- | ------- | ----------- | -------------------- |
| `_student`  | address | `0xAb84...` | Dirección del alumno |
| `_careerId` | uint256 | `1`         | ID de la carrera     |

### Validaciones

```javascript
✓ Solo REGISTRAR_ROLE puede ejecutar
✓ _student no puede ser address(0)
✓ careerId debe ser > 0
✓ El alumno no debe estar ya matriculado
```

### Evento Emitido

```solidity
event CareerAssigned(address indexed student, uint256 indexed careerId)
```

### Ejecución en Remix

```javascript
// Cuenta A (Admin)
Seleccionar: ConservatoryAcademy
Función: enrollStudent
Parámetros:
  _student: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2 (Cuenta B)
  _careerId: 1

✅ Tx exitosa
```

### Estado Modificado

```
ConservatoryAcademy.canonicalStudent[0xAb84...] = 0xAb84...
ConservatoryAcademy.activeWalletOfCanonical[0xAb84...] = 0xAb84...
ConservatoryAcademy.studentCareer[0xAb84...] = 1
ConservatoryAcademy.activeStudents[0xAb84...] = true
ConservatoryAcademy.academicRecords[0xAb84...] = [] (array vacío)
```

### Gas Estimado

```
Gas Used: ~45,000 gas
Costo: ~0.9 MATIC
```

---

## 📝 PASO 3: Calificar Todas las Materias

### Función

```solidity
submitGrade(address _student, uint256 _subjectId, uint8 _score, uint16 _professorId)
```

### Detalles

| Parámetro      | Tipo    | Ejemplo     | Descripción                 |
| -------------- | ------- | ----------- | --------------------------- |
| `_student`     | address | `0xAb84...` | Alumno a calificar          |
| `_subjectId`   | uint256 | `1`         | ID de la materia            |
| `_score`       | uint8   | `95`        | Nota (0-100, aprobado ≥ 60) |
| `_professorId` | uint16  | `1`         | ID numérico del profesor    |

### Validaciones

```javascript
✓ Solo PROFESSOR_ROLE puede ejecutar
✓ Alumno debe estar activo (activeStudents[_student] == true)
✓ Score debe ser 0-100
✓ Alumno debe estar registrado
✓ La materia no puede estar ya aprobada
```

### Estructura SubjectRecord (9 bytes optimizado)

```solidity
struct SubjectRecord {
    uint8 score;         // Nota final (0-100)
    uint8 attempts;      // Intentos realizados
    uint32 approvalDate; // Timestamp de aprobación
    bool approved;       // ¿Aprobada?
    uint16 professorId;  // ID del profesor
}
```

### Evento Emitido

```solidity
event GradeSubmitted(address indexed student, uint256 indexed subjectId,
                     uint8 score, uint16 indexed professorId)
```

### Ejecución en Remix (3 TXs, una por materia)

```javascript
// Cuenta C (Profesor)

// TX #1: Materia 1
Función: submitGrade
Parámetros:
  _student: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
  _subjectId: 1
  _score: 100
  _professorId: 1

✅ Tx exitosa, evento GradeSubmitted

// TX #2: Materia 2
Parámetros:
  _student: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
  _subjectId: 2
  _score: 95
  _professorId: 1

✅ Tx exitosa

// TX #3: Materia 3
Parámetros:
  _student: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
  _subjectId: 3
  _score: 90
  _professorId: 1

✅ Tx exitosa
```

### Estado Modificado

```
Después de TX #1:
ConservatoryAcademy.academicRecords[canonical][1] = {
    score: 100,
    attempts: 1,
    approvalDate: block.timestamp,
    approved: true,
    professorId: 1
}

Después de TX #2:
ConservatoryAcademy.academicRecords[canonical][2] = { ... }

Después de TX #3:
ConservatoryAcademy.academicRecords[canonical][3] = { ... }
```

### Gas Estimado (por TX)

```
Gas Used por submitGrade: ~55,000 gas
Total 3 TXs: ~165,000 gas
Costo Total: ~3.3 MATIC
```

### Optimización de Gas

```
Las 3 materias se empacan en 1 slot de 32 bytes (9×3=27 bytes).
Ahorro: ~60% en SSTORE frío vs. normal ERC721.
```

---

## ✅ PASO 4: Verificar Completitud (VIEW)

### Función

```solidity
hasCompletedAllSubjects(address _student) external view returns (bool)
```

### Parámetros

```
_student: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
```

### Lógica de Verificación

```javascript
1. Obtener canonical student de _student
2. Si no existe → return false
3. Obtener careerId del canonical
4. Si careerId == 0 → return false
5. Obtener requiredSubjects[] de esa carrera
6. Para cada materia requerida:
   ├─ ¿Existe el registro? → no → return false
   └─ ¿Está aprobada? → no → return false
7. Si pasó todos → return true
```

### Ejecución en Remix

```javascript
// Cualquier cuenta
Seleccionar: ConservatoryAcademy
Función: hasCompletedAllSubjects (botón azul = VIEW)
Parámetro:
  _student: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2

✅ Devuelve: true
```

### Gas Estimado

```
Gas Used: 0 (es VIEW/READ, no consume gas)
Costo: GRATIS
```

---

## 🎖️ PASO 5: Emitir Diploma SBT

### Función

```solidity
mintDiploma(address _graduate, bytes32 _legajoHash) external onlyRole(ISSUER_ROLE)
```

### Detalles

| Parámetro     | Tipo    | Ejemplo     | Descripción                   |
| ------------- | ------- | ----------- | ----------------------------- |
| `_graduate`   | address | `0xAb84...` | Alumno graduado               |
| `_legajoHash` | bytes32 | `0xaaaa...` | Hash del expediente académico |

### Validaciones

```javascript
✓ Solo ISSUER_ROLE puede ejecutar
✓ El alumno no debe tener ya un diploma
✓ El alumno debe haber completado todas las materias
  └─ ← CROSS-CONTRACT CALL A ACADEMY
```

### Cross-Contract Call Involucrado

```
mintDiploma()
  └─→ academyContract.hasCompletedAllSubjects(_graduate)
      └─→ Devuelve: true ✅
```

### Evento Emitido

```solidity
event DiplomaIssued(address indexed graduate, uint256 indexed tokenId, bytes32 legajoHash)
```

### Ejecución en Remix

```javascript
// Cuenta A (Admin con ISSUER_ROLE)
Seleccionar: ConservatoryDiploma
Función: mintDiploma
Parámetros:
  _graduate: 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
  _legajoHash: 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

✅ Tx exitosa, evento DiplomaIssued(0xAb84..., 1, 0xaaaa...)
```

### Estado Modificado

```
ConservatoryDiploma.studentDiploma[0xAb84...] = 1 (token ID)
ConservatoryDiploma.academicLegajos[1] = 0xaaaa...
ConservatoryDiploma.nextTokenId = 1
```

### Gas Estimado

```
Gas Used: ~85,000 gas
Costo: ~1.7 MATIC
```

### Características del SBT

```
✓ No transferible (bloqueado en _update)
✓ Único por alumno (máximo 1)
✓ Permanente (vinculado a wallet del graduado)
✓ Validación on-chain (requiere hasCompletedAllSubjects)
```

---

## 🔐 VALIDACIONES DE SEGURIDAD

### En mintDiploma()

```javascript
✓ Rol ISSUER_ROLE obligatorio
✓ Chequeo de diploma duplicado: if (studentDiploma[_graduate] != 0) revert
✓ Validación atómica on-chain: hasCompletedAllSubjects call
✓ Patrón CEI aplicado (Checks → Effects → Interactions)
```

### En submitGrade()

```javascript
✓ Rol PROFESSOR_ROLE obligatorio
✓ Alumno debe estar activo
✓ Score válido (0-100)
✓ Protección: materia no puede sobrescribirse si ya está aprobada
```

### En enrollStudent()

```javascript
✓ Rol REGISTRAR_ROLE obligatorio
✓ Wallet válida (no address(0))
✓ Carrera válida (> 0)
✓ Alumno no puede estar ya matriculado
```

---

## 📊 Tabla Comparativa de Costos

| Paso      | Función                     | Rol       | Gas         | Costo (20 gwei) | Acción         |
| --------- | --------------------------- | --------- | ----------- | --------------- | -------------- |
| 1         | `defineCurriculum()`        | REGISTRAR | 25,000      | 0.5 MATIC       | Crea carrera   |
| 2         | `enrollStudent()`           | REGISTRAR | 45,000      | 0.9 MATIC       | Matricula      |
| 3.1       | `submitGrade()`             | PROFESSOR | 55,000      | 1.1 MATIC       | Califica Mat.1 |
| 3.2       | `submitGrade()`             | PROFESSOR | 55,000      | 1.1 MATIC       | Califica Mat.2 |
| 3.3       | `submitGrade()`             | PROFESSOR | 55,000      | 1.1 MATIC       | Califica Mat.3 |
| 4         | `hasCompletedAllSubjects()` | —         | 0           | GRATIS          | Verifica       |
| 5         | `mintDiploma()`             | ISSUER    | 85,000      | 1.7 MATIC       | Emite SBT      |
| **TOTAL** | —                           | —         | **320,000** | **~6.4 MATIC**  | Flujo completo |

---

## 🔗 Cross-Contract Interaction

### En mintDiploma()

```
ConservatoryDiploma.mintDiploma(0xAb84..., 0xaaaa...)
  ├─ Chequeo interno: ¿studentDiploma[0xAb84...] == 0?
  ├─ Cross-Contract Call:
  │  └─→ ConservatoryAcademy.hasCompletedAllSubjects(0xAb84...)
  │      └─→ Retorna: true ✅
  ├─ Mint SBT: _safeMint(0xAb84..., 1)
  ├─ Store legajo: academicLegajos[1] = 0xaaaa...
  ├─ Register diploma: studentDiploma[0xAb84...] = 1
  └─ Emite: DiplomaIssued event
```

### En Etherscan/Polygonscan

```
TX Hash: 0x...
Status: ✅ Success

Tab "Internal Txs":
  ├─ TX Principal: Diploma.mintDiploma()
  └─ Internal TX #1: Academy.hasCompletedAllSubjects()
```

---

## 🧪 Checklist de Testing

### ✅ Testeado en Remix VM

- [x] Paso 1: defineCurriculum() funciona
- [x] Paso 2: enrollStudent() funciona
- [x] Paso 3: submitGrade() (3 TXs) funciona
- [x] Paso 4: hasCompletedAllSubjects() devuelve true
- [x] Paso 5: mintDiploma() emite diploma SBT
- [x] Cross-Contract Call: Academy.hasCompletedAllSubjects() es llamado
- [x] SBT Seguridad: transferFrom() revert con SBTTransferLocked()

### ❌ Pendiente en Testnet Real

- [ ] Desplegar en Polygon Amoy
- [ ] Verificar en Polygonscan
- [ ] Probar flujo completo con gas real
- [ ] Documentar TX hashes en este archivo

---

## 📝 Notas Adicionales

### Estructura SubjectRecord Optimization

```
9 bytes = 1 uint8 + 1 uint8 + 4 uint32 + 1 bool + 2 uint16
3 registros = 27 bytes = caben en 1 slot de 32 bytes

Impacto: 75% ahorro en SSTORE frío para arrays dinámicos.
```

### Patrón CEI

```
mintDiploma() sigue Checks-Effects-Interactions:

Checks:      ✓ studentDiploma check
             ✓ hasCompletedAllSubjects call
Effects:     ✓ nextTokenId++
             ✓ _safeMint()
             ✓ academicLegajos[]
             ✓ studentDiploma[]
Interactions: ✓ Event emission
```

### SBT (Soulbound Token)

```
No transferible mediante override de _update():
  if (from != address(0) && to != address(0))
    revert SBTTransferLocked();

Permite:
  ✓ Mint (from == address(0))
  ✓ Burn (to == address(0))

Bloquea:
  ✗ transferFrom()
  ✗ safeTransferFrom()
  ✗ approve()
```

---

## 📚 Referencias

### Archivos Relevantes

- `contracts/ConservatoryAcademy.sol`: Líneas 79-156
- `contracts/ConservatoryDiploma.sol`: Líneas 86-98
- `TESTING_RESULTS.md`: Resultados completos de 13 tests

### Estándares Implementados

- ERC721: NFT estándar
- ERC165: Interface detection
- AccessControl: Manejo de roles
- CEI Pattern: Seguridad de reentrancy

### Testnets

- Polygon Amoy: https://amoy.polygonscan.com/
- Faucet: https://faucet.polygon.technology/

---

**Última Actualización:** 4 de Junio de 2026
**Autor:** Vale Lattanzi (@vale.lattanzi15@gmail.com)
**Proyecto:** DMAL - Blockchain TPI UTN
