# DMS Platform — Multi-tenant Dealer Management System

## Fase 0: Fundación (Completa)

Arquitectura multi-tenant sólida para concesionarios de vehículos. Cada concesionario es un **tenant** totalmente aislado con múltiples **sucursales**.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 10 + TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 5 |
| Autenticación | JWT (passport-jwt) + bcrypt |
| Validación | class-validator + class-transformer |

---

## Características Fase 0

- **Multi-tenancy completa** — cada concesionario tiene datos completamente aislados
- **Sucursales múltiples** — con control de acceso por sucursal/usuario
- **RBAC granular** — Roles + Permisos configurables por tenant
- **Customer 360 base** — cliente centralizado con vehículos y contratos
- **Estados dinámicos** — nada hardcodeado, todo configurable por tenant y tipo de entidad
- **Caja obligatoria** — todos los pagos pasan por sesión de caja abierta
- **Auditoría básica** — registro de acciones críticas con before/after
- **Autenticación JWT** — con contexto de tenant y sucursal en el token
- **Plantillas de notificación** — base lista para integrar Resend (Fase 1)

---

## Inicio Rápido

### 1. Requisitos previos

```bash
# Node.js 18+, Docker
docker --version
node --version
```

### 2. Levantar infraestructura

```bash
cd dms-platform
cp .env.example .env   # editar DATABASE_URL y JWT_SECRET

docker-compose up -d   # levanta PostgreSQL en puerto 5432
```

### 3. Instalar dependencias y migrar

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
```

### 4. Iniciar servidor

```bash
npm run start:dev
# Servidor en http://localhost:3000
```

---

## Usuarios de Prueba (después del seed)

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin@demo-dealer.com | Admin123! | Admin |
| cajero@demo-dealer.com | Cashier123! | Cashier |

**Importante:** enviar header `x-tenant-id: <tenant_id>` en cada request (ver output del seed).

---

## API Endpoints

### Autenticación
```
POST /auth/login       — { email, password } + header x-tenant-id
GET  /auth/me          — Bearer token requerido
POST /auth/logout      — Bearer token requerido
```

### Usuarios
```
GET    /users
POST   /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id      — desactiva (soft delete)
```

### Roles y Permisos
```
GET    /roles
POST   /roles
GET    /roles/permissions
POST   /roles/:id/permissions
DELETE /roles/:id/permissions/:permissionId
POST   /roles/:id/users/:userId
DELETE /roles/:id/users/:userId
```

### Sucursales
```
GET    /branches
POST   /branches
GET    /branches/:id
PATCH  /branches/:id
DELETE /branches/:id   — desactiva
```

### Clientes (Customer 360)
```
GET    /customers?search=&status=&page=&limit=
POST   /customers
GET    /customers/:id  — vista 360 con vehículos y contratos
PATCH  /customers/:id
```

### Caja
```
POST /cash-sessions/open
POST /cash-sessions/:id/close
GET  /cash-sessions/current
GET  /cash-sessions
GET  /cash-sessions/:id
```

### Plantillas de Notificación
```
GET   /notification-templates
POST  /notification-templates
GET   /notification-templates/:id
PATCH /notification-templates/:id
```

### Auditoría
```
GET /audit-logs?entityType=&userId=&action=&from=&to=
```

---

## Estructura del Proyecto

```
dms-platform/
├── prisma/
│   ├── schema.prisma          # Esquema completo con todos los modelos
│   ├── seed.ts                # Datos iniciales: tenant, roles, usuarios, estados
│   └── migrations/
├── src/
│   ├── prisma/
│   │   ├── prisma.module.ts   # Módulo global
│   │   └── prisma.service.ts  # PrismaClient con lifecycle hooks
│   ├── modules/
│   │   ├── auth/              # Login, JWT, Guards, Strategies
│   │   ├── users/             # CRUD usuarios por tenant
│   │   ├── roles/             # Roles + Permisos + Asignaciones
│   │   ├── branches/          # Sucursales por tenant
│   │   ├── customers/         # Customer 360 con búsqueda y paginación
│   │   ├── cash-sessions/     # Caja con validación de doble apertura
│   │   ├── notification-templates/ # Plantillas por tenant
│   │   └── audit-logs/        # Log de acciones críticas
│   ├── main.ts
│   └── app.module.ts
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## Correcciones sobre el código de referencia

| Archivo | Problema original | Solución aplicada |
|---------|------------------|-------------------|
| `auth.module.ts` | `JwtModule.register` con secret hardcodeado | `JwtModule.registerAsync` + `ConfigService` |
| `auth.module.ts` | Faltaba `LocalStrategy` y `LocalAuthGuard` | Agregados `local.strategy.ts` + `local-auth.guard.ts` |
| `auth.service.ts` | `findByEmail` sin `tenantId` | Login requiere `x-tenant-id` header, scoped por tenant |
| `tenant.guard.ts` | Leía `x-tenant-id` post-auth (spoofable) | Post-auth: `tenantId` viene del JWT payload |
| `users.service.ts` | `where: { id, tenant_id: tenantId }` inválido en Prisma | `findFirst({ where: { id, tenant_id } })` + `update({ where: { id } })` |
| Schema | `branches.code @unique` global | `@@unique([tenant_id, code])` — único por tenant |
| Schema | `users.email @unique` global | `@@unique([tenant_id, email])` — único por tenant |
| Schema | Relaciones sin `@relation` nombradas | Agregados nombres en relaciones ambiguas |

---

## Próximos Pasos (Fase 1)

1. Módulo de ventas: contado y financiamiento
2. Generación automática de cuotas con tasas configurables
3. Pagos de cuotas vinculados a caja
4. Documentos: contrato, pagaré (PDF)
5. Módulo de vehículos e inventario completo
6. Integración Resend para notificaciones reales
