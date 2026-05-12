/** Unidad física declarada en el producto (por envase / unidad vendida). */
export type ProductContentUnit = "kg" | "l"

export function contentUnitShortLabel(unit: ProductContentUnit): "kg" | "L" {
  return unit === "l" ? "L" : "kg"
}

/**
 * Litros o kg totales de la venta = cantidad × contenido por envase del producto.
 * No se persiste en la tabla `sales`; se calcula al mostrar o al exportar.
 */
export function physicalSaleTotalAmount(
  quantity: number,
  contentPerUnit: number | null | undefined,
  unit: ProductContentUnit | null | undefined,
): number | null {
  if (contentPerUnit == null || unit == null) return null
  const q = Number(quantity)
  const per = Number(contentPerUnit)
  if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(per) || per <= 0) return null
  return Math.round(q * per * 1000) / 1000
}

/**
 * Total físico = cantidad vendida × contenido por unidad.
 * Devuelve null si el producto no tiene dato de contenido.
 */
export function formatPhysicalSaleTotal(
  quantity: number,
  contentPerUnit: number | null | undefined,
  unit: ProductContentUnit | null | undefined,
): string | null {
  const amount = physicalSaleTotalAmount(quantity, contentPerUnit, unit)
  if (amount == null || unit == null) return null
  return `${amount} ${contentUnitShortLabel(unit)}`
}

/** Texto fijo para listados cuando no hay contenido configurado en el producto. */
export const NO_PHYSICAL_CONTENT_LABEL = "—"
