# AGENTS.md — Access Manager

## Stack
- Backend: Spring Boot 3 + JPA + PostgreSQL + JWT (jjwt 0.12.x) + ZXing QR
- Web: React + Vite + TypeScript + Tailwind + Zustand + React Query
- Mobile: React Native + Expo + expo-camera

## Reglas obligatorias
- NUNCA usar System.out.println — siempre @Slf4j + log.info/warn/error
- NUNCA poner lógica de negocio en Controllers — solo en Services
- NUNCA poner validación de acceso fuera de AccessService.java
- NUNCA campos públicos en entidades sin @Column
- SIEMPRE usar @Transactional en métodos de Service que escriben en BD
- SIEMPRE devolver DTOs desde Controllers, nunca entidades JPA directamente

## Naming Java
- Entidades: PascalCase (Event, Ticket, AccessLog)
- DTOs Request: CreateXxxRequest, ScanRequest
- DTOs Response: XxxResponse, ScanResponse
- Services: @Service, sufijo Service
- Repositorios: @Repository, extienden JpaRepository, sufijo Repository
- Exceptions propias en package exception/, sufijo Exception

## Endpoints REST
- Base path: /api/{recurso}
- Plural para colecciones: /api/events, /api/tickets
- Acciones verbales con verbo HTTP: PUT /api/events/{id}/activate
- Siempre devolver { error, status, timestamp } en errores

## Reglas React/TypeScript
- Props siempre tipadas con interface o type
- Nunca any — usa unknown si es necesario
- Fetching con @tanstack/react-query (useQuery, useMutation)
- Estado global con Zustand (no Context para auth)
- Axios client centralizado en src/api/client.ts

## Lo que NUNCA debe hacer
- Mezclar lógica de escaneo en el Controller
- Usar ddl-auto: create-drop en producción
- Hardcodear secrets — siempre variables de entorno