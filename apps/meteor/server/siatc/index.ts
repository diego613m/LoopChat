// Punto de entrada del código propio de SIATC (Fase 2 del plan de migración de
// LoopChat). Se importa por su efecto lateral (registra los hooks de aprobación)
// desde server/main.ts — ver ese archivo para el orden de carga.
import './hooks';
import './graphMailerPatch';
