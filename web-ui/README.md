# DMAL Web UI - React + Vite + TypeScript

**Decentralized Music Academy Ledger** - Frontend moderno para interactuar con contratos inteligentes de blockchain.

## Características

- 🎼 **Portal Docente**: Carga de notas académicas firmadas criptográficamente
- 🎓 **Portal Alumno**: Registro inmutable de propiedad intelectual (IPFS)
- 🔍 **Portal Validador**: Auditoría pública de credenciales y Soulbound Tokens
- ⚙️ **Consola Administrativa**: Recuperación de emergencia de wallets comprometidas

## Quick Start

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo (http://localhost:5173)
pnpm run dev

# Build para producción
pnpm run build

# Preview de la compilación
pnpm run preview
```

## Estructura del Proyecto

```
web-ui/
├── src/
│   ├── components/          # Componentes React reutilizables
│   │   ├── Header.tsx      # Navegación y selector de rol
│   │   ├── ProfessorPortal.tsx
│   │   ├── StudentPortal.tsx
│   │   ├── ValidatorPortal.tsx
│   │   ├── AdminPortal.tsx
│   │   ├── LogsConsole.tsx
│   │   ├── LedgerView.tsx
│   │   └── Icons.tsx       # Iconos SVG
│   ├── services/           # Servicios blockchain
│   │   └── blockchain.ts   # Abstracción de Web3 con ethers.js
│   ├── store/              # Estado global con Zustand
│   │   └── appStore.ts
│   ├── types/              # Tipos TypeScript compartidos
│   │   └── index.ts
│   ├── App.tsx            # Componente principal
│   └── main.tsx
├── public/                 # Activos estáticos
├── tailwind.config.ts      # Configuración Tailwind CSS
├── postcss.config.mjs      # Configuración PostCSS
├── vite.config.ts          # Configuración Vite
└── tsconfig.json           # Configuración TypeScript
```

## Stack Tecnológico

- **React 19** - UI library
- **Vite 8** - Build tool y dev server
- **TypeScript 6** - Type safety
- **Tailwind CSS 4** - Utility-first CSS
- **ethers.js v6** - Conexión blockchain
- **Zustand** - State management global
- **Viem** - Web3 utilities (opcional)

## Integración con Contratos

### Direcciones Desplegadas (Sepolia)

```javascript
const ADDRESSES = {
  academy: '0xa93939fb4698de788B51ec5f6620E0aD318b8A62',
  diploma: '0x4E0A77e01F85c24d87c3605e1dFD09EaF62d1B00',
  composition: '0x484FCeA1e42D9997b8E98c5007214c160BFD90D2'
}
```

### Uso del Servicio Blockchain

```typescript
import { blockchainService } from './services/blockchain'

// Inicializar conexión
const { address, provider } = await blockchainService.initialize()

// Enviar nota académica
const receipt = await blockchainService.submitGrade(
  studentAddress,
  subjectId,
  score,
  professorId
)

// Registrar composición IP
const receipt = await blockchainService.registerComposition(
  title,
  ipfsHash
)
```

## Flujos Principales

### 1. Carga de Notas (Profesor)
- Selección de materia
- Validación de rango de calificación (0-100)
- Simulación de transacción blockchain
- Estado PENDING → CONFIRMED

### 2. Registro IP (Alumno)
- Carga de partitura/audio
- Generación de hash IPFS
- Verificación automática de regularidad
- Cross-contract query para fee exemption

### 3. Auditoría (Validador)
- Diploma visual SBT
- Historial académico inmutable
- Escrutinio público con hashes

### 4. Recuperación (Admin)
- Revocación de SBT comprometido
- Reemisión a nueva wallet
- Migración del historial académico

## State Management

### Zustand Store

```typescript
import { useAppStore } from './store/appStore'

// En cualquier componente
const { walletAddress, grades, addGrade, setBlockHeight } = useAppStore()
```

## Desarrollo

### Scripts

```bash
pnpm dev          # Servidor con HMR
pnpm build        # TypeScript + Vite build
pnpm preview      # Preview de dist/
pnpm lint         # ESLint + TypeScript check
```

### Diferencias con el MVP HTML

**MVP (ecosistema_dmal_mvp.html)**
- Aplicación monolítica en HTML/React vía CDN
- Simulación total (no conectada a contratos reales)
- Funcionalidad de prueba/prototipo

**Web UI (web-ui/)**
- Proyecto React moderno con Vite
- Integración real con ethers.js para blockchain
- Arquitectura escalable y modular
- TypeScript para type-safety
- Gestión de estado con Zustand
- Tailwind CSS para estilos
- Separación clara: componentes, servicios, store, types

## Roadmap

- [ ] Conectar con MetaMask/Web3 modal
- [ ] Integración IPFS real (Pinata/Filecoin)
- [ ] Soporte múltiples chains
- [ ] Dashboard de analíticos
- [ ] Exportar certificados PDF
- [ ] Notificaciones en tiempo real
- [ ] Temas dark/light
- [ ] Autenticación con signature

## Requisitos

- Node.js 18+
- pnpm 11+
- MetaMask o compatible Web3 wallet

## Licencia

MIT - Tesis de Ingeniería en Sistemas - UTN ISI
```
