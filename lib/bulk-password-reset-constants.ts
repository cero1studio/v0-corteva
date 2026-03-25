/**
 * Compartido entre cliente y servidor. Las constantes no deben importarse solo desde
 * módulos "use server": Next no las expone de forma iterable en el cliente.
 */
export const BULK_RESETTABLE_ROLE_VALUES = [
  "capitan",
  "director_tecnico",
  "arbitro",
  "representante",
  "supervisor",
] as const

export type BulkResettableRole = (typeof BULK_RESETTABLE_ROLE_VALUES)[number]
