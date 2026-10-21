import type { KotDetailsItem } from "@/api/kot";
import type { Product } from "@/api/products";
import type { WaiterOrderLine } from "@/api/waiterOrders";

export function matchLineToProduct(
  line: KotDetailsItem,
  catalogue: Product[],
): Product | null {
  return (
    catalogue.find(
      (p) => line.productId != null && p.product_id === line.productId,
    ) ??
    catalogue.find(
      (p) =>
        p.product_name.trim().toLowerCase() === line.name.trim().toLowerCase(),
    ) ??
    catalogue.find(
      (p) => line.variationId != null && p.variation_id === line.variationId,
    ) ??
    null
  );
}

export function buildEditPrefill(
  lines: KotDetailsItem[],
  catalogue: Product[],
): Record<number, number> {
  const seed: Record<number, number> = {};
  for (const item of lines) {
    if (item.qty <= 0) continue;

    const match = matchLineToProduct(item, catalogue);

    if (match) {
      seed[match.product_id] = (seed[match.product_id] ?? 0) + item.qty;
    }
  }
  return seed;
}

function distribute(wanted: number, existingQtys: number[]): number[] {
  const out = existingQtys.map(() => 0);
  let remaining = wanted;
  existingQtys.forEach((existing, position) => {
    const isLast = position === existingQtys.length - 1;
    const take = isLast ? remaining : Math.min(existing, remaining);
    out[position] = Math.max(0, take);
    remaining -= take;
  });
  return out;
}

export function buildSyncLines(
  lines: KotDetailsItem[],
  catalogue: Product[],
  qtyByProduct: Record<number, number>,
): WaiterOrderLine[] {
  const matched = lines.map((line) => matchLineToProduct(line, catalogue));

  const indexesByProduct = new Map<number, number[]>();
  lines.forEach((line, index) => {
    const product = matched[index];
    if (!product) return;
    const indexes = indexesByProduct.get(product.product_id) ?? [];
    indexes.push(index);
    indexesByProduct.set(product.product_id, indexes);
  });

  const splitByIndex = new Map<number, number>();
  for (const [productId, indexes] of indexesByProduct) {
    const split = distribute(
      qtyByProduct[productId] ?? 0,
      indexes.map((index) => lines[index].qty),
    );
    indexes.forEach((lineIndex, position) => {
      splitByIndex.set(lineIndex, split[position]);
    });
  }

  return lines.map((line, index) => {
    const product = matched[index];
    return {
      rowId: line.rowId,
      productId: product?.product_id ?? line.productId,
      variationId: product?.variation_id ?? line.variationId,
      name: line.name,
      desiredQty: product ? (splitByIndex.get(index) ?? 0) : line.qty,
    };
  });
}
