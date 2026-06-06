# Estructura de Proyectos - DMAL

Este repositorio contiene **dos proyectos diferenciados**:

## 1. Proyecto Blockchain (Raíz: `/`)

**Stack**: Hardhat + Solidity + TypeScript (Test)

### Contenido
- **Contratos Inteligentes** (`/contracts/`)
  - `ConservatoryAcademy.sol` - Gestión académica y registro de notas
  - `ConservatoryDiploma.sol` - Tokens SBT (Soulbound) para diplomas
  - `CompositionRegistry.sol` - Registro de propiedad intelectual (IPFS)

- **Configuración Hardhat**
  - Compilación de contratos (Solidity 0.8.20)
  - Deploy en redes locales y testnet
  - Scripts de testing

- **Artefactos Compilados** (`/artifacts/`)
  - ABIs de contratos (generadas automáticamente)

- **Direcciones Desplegadas** (Sepolia)
  ```
  Academia:    0xa93939fb4698de788B51ec5f6620E0aD318b8A62
  Diploma:     0x4E0A77e01F85c24d87c3605e1dFD09EaF62d1B00
  Composición: 0x484FCeA1e42D9997b8E98c5007214c160BFD90D2
  ```

### Compilación
```bash
npm run compile  # Genera ABIs en /artifacts
npm run test     # Ejecuta suite de tests
```

---

## 2. Proyecto Web UI (`/web-ui/`)

**Stack**: React 19 + Vite + TypeScript + Tailwind CSS

### Contenido

#### Componentes (`/src/components/`)
- **Header.tsx** - Navegación, selector de rol, info de bloque
- **ProfessorPortal.tsx** - Carga de notas académicas (firmadas)
- **StudentPortal.tsx** - Registro de composiciones (IPFS)
- **ValidatorPortal.tsx** - Auditoría de diplomas SBT
- **AdminPortal.tsx** - Recuperación de wallets comprometidas
- **LogsConsole.tsx** - Simulación de logs de Spring Boot
- **LedgerView.tsx** - Visualización de transacciones blockchain
- **Icons.tsx** - Iconos SVG reutilizables

#### Servicios (`/src/services/`)
- **blockchain.ts** - Abstracción de Web3 con ethers.js
  - Inicialización de provider/signer
  - Funciones de lectura/escritura a contratos
  - Manejo de transacciones

#### Estado Global (`/src/store/`)
- **appStore.ts** - Zustand store
  - Estado de la aplicación (rol, wallet, bloque)
  - Historial de calificaciones
  - Historial de composiciones
  - Transacciones blockchain
  - Logs de backend

#### Tipos (`/src/types/`)
- **index.ts** - TypeScript interfaces
  - `SubjectRecord`, `Grade`, `Composition`, `Transaction`
  - `UserRole`, `ContractAddresses`, `AppState`

#### Estilos
- **tailwind.config.ts** - Configuración Tailwind CSS 4
- **index.css** - Importaciones de Tailwind
- **postcss.config.mjs** - Configuración PostCSS con @tailwindcss/postcss

### Desarrollo
```bash
pnpm install    # Instalar dependencias
pnpm run dev    # Servidor de desarrollo (localhost:5173)
pnpm run build  # Build para producción
```

---

## Diferencias Clave

| Aspecto | Proyecto Blockchain | Web UI |
|--------|-------------------|--------|
| **Propósito** | Smart contracts y lógica on-chain | Interfaz de usuario |
| **Lenguaje** | Solidity + TypeScript (tests) | TypeScript + React |
| **Build Tool** | Hardhat | Vite |
| **Salida** | Bytecode + ABI + Artifacts | HTML + JS/CSS minimizado |
| **Dependencias** | @nomicfoundation/hardhat-toolbox | React, ethers.js, Zustand, Tailwind |
| **Ejecución** | npm run compile/test | pnpm run dev/build |
| **Target** | EVM Blockchain | Navegador Web |
| **Estado** | Inmutable en blockchain | Reactivo en memoria + localStorage |

---

## Flujo Integrado

```
┌─────────────────────────────────────┐
│         WEB UI (Vite + React)       │
│  - ProfessorPortal                  │
│  - StudentPortal                    │
│  - ValidatorPortal                  │
│  - AdminPortal                      │
└─────────────────────────────────────┘
           │
           │ ethers.js
           │ (submitGrade, registerComposition)
           ▼
┌─────────────────────────────────────┐
│    BLOCKCHAIN (Smart Contracts)     │
│  - ConservatoryAcademy.sol          │
│  - ConservatoryDiploma.sol          │
│  - CompositionRegistry.sol          │
└─────────────────────────────────────┘
           │
           │ Event Emission
           │
           ▼
┌─────────────────────────────────────┐
│  EVENT LISTENER (Backend - Spring)  │
│  - Sincroniza PostgreSQL            │
│  - Emite notificaciones             │
└─────────────────────────────────────┘
```

---

## MVP vs Production UI

### MVP (ecosistema_dmal_mvp.html)
- ✓ Prototipo funcional monolítico
- ✓ Simulación 100% en React (sin blockchain real)
- ✓ Todos los flujos visibles
- ✗ No escalable
- ✗ No integrado con contratos
- ✗ Sin gestión de estado profesional
- ✗ Código acoplado

### Web UI (production-ready)
- ✓ Arquitectura modular y escalable
- ✓ Integración real con ethers.js
- ✓ Gestión de estado profesional (Zustand)
- ✓ Type-safe con TypeScript completo
- ✓ Build optimizado con Vite
- ✓ Tailwind para estilos sistemáticos
- ✓ Separación de responsabilidades
- ✓ Listo para MetaMask + testnet/mainnet

---

## Próximos Pasos

1. **Conectar MetaMask**
   ```typescript
   // En blockchainService.initialize()
   const accounts = await window.ethereum.request({
     method: 'eth_requestAccounts'
   })
   ```

2. **Integrar IPFS Real**
   ```typescript
   // Usar Pinata o Filecoin SDK
   const hash = await uploadToPinata(file)
   ```

3. **Backend Spring Boot**
   ```typescript
   // Event listener en Java
   @Transactional
   public void onGradeSubmitted(GradeSubmittedEvent event) {
     // Sincroniza BD PostgreSQL
   }
   ```

4. **Notificaciones Real-Time**
   ```typescript
   // WebSocket o Server-Sent Events
   const ws = new WebSocket('ws://localhost:8080/notifications')
   ```

---

## Árbol de Directorios Completo

```
├── /
│   ├── contracts/                  # Solidity
│   ├── artifacts/                  # ABIs compiladas
│   ├── scripts/                    # Deploy scripts
│   ├── test/                       # Tests Hardhat
│   ├── package.json                # Hardhat deps
│   ├── hardhat.config.js
│   ├── README.md                   # Documentación blockchain
│   ├── ARCHITECTURE_DECISIONS.md   # ADRs
│   ├── DIPLOMA_FLOW_ROADMAP.md
│   └── direcciones.txt             # Contract addresses
│
└── web-ui/
    ├── src/
    │   ├── components/
    │   ├── services/
    │   ├── store/
    │   ├── types/
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── public/
    ├── dist/                       # Build output
    ├── package.json                # React deps
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    └── README.md
```

---

## Comandos Rápidos

```bash
# Blockchain Project
cd /home/valentino/Documentos/universidad/blockchain/tpi/
npm run compile
npm run test

# Web UI Project
cd web-ui/
pnpm install
pnpm run dev      # http://localhost:5173
pnpm run build
```

## Autor
Vale Lattanzi - Tesis de Ingeniería en Sistemas - UTN ISI

## Licencia
MIT
