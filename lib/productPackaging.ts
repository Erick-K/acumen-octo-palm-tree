import type { Product } from '../types';

export type PackagingUnit = NonNullable<Product['packagingUnit']>;

export const PACKAGING_UNIT_LABELS: Record<PackagingUnit, string> = {
  pieces: 'Pieces',
  outers: 'Outers',
  cartons: 'Cartons',
};

/** Segment is a size/weight measure, e.g. 50ml, 500g, 1.5L, 5s — not a pack count. */
const MEASURE_SEGMENT = /^\d+(?:\.\d+)?\s*(?:ml|l|litres?|g|kg|s)\b/i;

function isMeasureSegment(segment: string) {
  return MEASURE_SEGMENT.test(segment.trim());
}

function parseLeadingNumber(segment: string) {
  const match = segment.trim().match(/^(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Pack size (pieces per outer/carton) from description segments between "x".
 * Skips numbers attached to units (ml, g, L, kg, s). Uses the bare number.
 * - "50mlx6" → 6
 * - "500gx12" → 12
 * - "5sx40x41.3" → 40
 * - "40x500gx41.3" → 40 (not 500)
 */
export function getPackCountFromDescription(description?: string): number | undefined {
  const source = (description || '').trim();
  if (!source) return undefined;

  const parts = source.split(/x/i).map(part => part.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;

  const packCandidates: number[] = [];

  for (const part of parts) {
    if (isMeasureSegment(part)) continue;
    const value = parseLeadingNumber(part);
    if (value !== undefined) packCandidates.push(value);
  }

  if (packCandidates.length === 0) return undefined;

  const integers = packCandidates.filter(Number.isInteger);
  if (integers.length === 0) return undefined;

  if (integers.length === 1) return integers[0];

  return integers[integers.length - 1];
}

export function normalizeProductDescriptionKey(description?: string) {
  return (description || '').trim().toLowerCase();
}

export function getProductGroupKey(product: Product) {
  const descriptionKey = normalizeProductDescriptionKey(product.description);
  return descriptionKey || `product:${product.id}`;
}

export function getProductsInGroup(products: Product[], referenceProduct: Product) {
  const key = getProductGroupKey(referenceProduct);
  if (key.startsWith('product:')) return [referenceProduct];
  return products.filter(product => getProductGroupKey(product) === key);
}

export function findProductForPackagingUnit(
  products: Product[],
  referenceProduct: Product,
  unit: PackagingUnit
): Product | undefined {
  return getProductsInGroup(products, referenceProduct).find(
    product => (product.packagingUnit || 'pieces') === unit
  );
}

/** One picker row per description group (prefers pieces, then outers, then cartons). */
export function getRepresentativeProducts(products: Product[]): Product[] {
  const groups = new Map<string, Product[]>();

  for (const product of products) {
    const key = getProductGroupKey(product);
    const group = groups.get(key) || [];
    group.push(product);
    groups.set(key, group);
  }

  const priority: PackagingUnit[] = ['pieces', 'outers', 'cartons'];
  return Array.from(groups.values()).map(group => {
    for (const unit of priority) {
      const match = group.find(product => (product.packagingUnit || 'pieces') === unit);
      if (match) return match;
    }
    return group[0];
  });
}

export function getGroupPieceStock(products: Product[], referenceProduct: Product) {
  const group = getProductsInGroup(products, referenceProduct);
  if (group.length === 0) return 0;
  return Math.max(0, ...group.map(product => toPieceCount(product)));
}

export function getPackagingUnitsInGroup(products: Product[], referenceProduct: Product): PackagingUnit[] {
  const group = getProductsInGroup(products, referenceProduct);
  return (['pieces', 'outers', 'cartons'] as PackagingUnit[]).filter(unit =>
    group.some(product => (product.packagingUnit || 'pieces') === unit)
  );
}

export function getOrderableStockForUnit(
  products: Product[],
  referenceProduct: Product,
  unit: PackagingUnit
) {
  const product = findProductForPackagingUnit(products, referenceProduct, unit);
  if (!product) return 0;
  const groupPieceStock = getGroupPieceStock(products, referenceProduct);
  return Number(fromPieceCount(groupPieceStock, product).toFixed(2));
}

export function getMissingPackagingUnits(products: Product[], referenceProduct: Product): PackagingUnit[] {
  const configured = getPackagingUnitsInGroup(products, referenceProduct);
  return (['pieces', 'outers', 'cartons'] as PackagingUnit[]).filter(unit => !configured.includes(unit));
}

export function getAvailablePackagingUnits(
  products: Product[],
  referenceProduct: Product
): PackagingUnit[] {
  return getPackagingUnitsInGroup(products, referenceProduct).filter(
    unit => getOrderableStockForUnit(products, referenceProduct, unit) > 0
  );
}

/** All product rows that belong to in-stock description groups. */
export function getOrderableProducts(products: Product[]): Product[] {
  return products
    .filter(product => getGroupPieceStock(products, product) > 0)
    .sort((a, b) => {
      const keyCompare = getProductGroupKey(a).localeCompare(getProductGroupKey(b));
      if (keyCompare !== 0) return keyCompare;
      const unitOrder: Record<PackagingUnit, number> = { pieces: 0, outers: 1, cartons: 2 };
      return unitOrder[a.packagingUnit || 'pieces'] - unitOrder[b.packagingUnit || 'pieces'];
    });
}

export function getPiecesPerOuter(product: Product) {
  const fromDescription = getPackCountFromDescription(product.description);
  if (fromDescription) return fromDescription;
  return Math.max(1, Number(product.piecesPerOuter || 1));
}

export function getPiecesPerCarton(product: Product) {
  const fromDescription = getPackCountFromDescription(product.description);
  if (fromDescription) return fromDescription;
  return Math.max(getPiecesPerOuter(product), Number(product.piecesPerCarton || 1));
}

export function toPieceCount(product: Product) {
  if (product.packagingUnit === 'cartons') return product.stock * getPiecesPerCarton(product);
  if (product.packagingUnit === 'outers') return product.stock * getPiecesPerOuter(product);
  return product.stock;
}

export function fromPieceCount(pieceCount: number, product: Product) {
  if (product.packagingUnit === 'cartons') return pieceCount / getPiecesPerCarton(product);
  if (product.packagingUnit === 'outers') return pieceCount / getPiecesPerOuter(product);
  return pieceCount;
}

function normalizeProductPackaging(product: Product): Product {
  return {
    ...product,
    packagingUnit: product.packagingUnit || 'pieces',
    piecesPerOuter: getPiecesPerOuter(product),
    piecesPerCarton: getPiecesPerCarton(product),
  };
}

function getCanonicalPieceCount(group: Product[], sourceProductId?: number) {
  if (sourceProductId !== undefined) {
    const source = group.find(product => product.id === sourceProductId);
    if (source) return toPieceCount(source);
  }

  const piecesRow = group.find(product => product.packagingUnit === 'pieces');
  if (piecesRow) return toPieceCount(piecesRow);

  return Math.max(...group.map(product => toPieceCount(product)));
}

/**
 * Keep products with the same description in sync: shared pack size and equivalent stock.
 * Pass sourceProductId when one row was just edited or sold so siblings follow it.
 */
export function alignProductsByDescription(products: Product[], sourceProductId?: number): Product[] {
  const normalizedProducts = products.map(normalizeProductPackaging);
  const groups = new Map<string, Product[]>();

  for (const product of normalizedProducts) {
    const key = normalizeProductDescriptionKey(product.description);
    if (!key) continue;
    const group = groups.get(key) || [];
    group.push(product);
    groups.set(key, group);
  }

  const canonicalPieceCount = new Map<string, number>();
  for (const [key, group] of groups) {
    if (group.length < 2) continue;
    canonicalPieceCount.set(key, getCanonicalPieceCount(group, sourceProductId));
  }

  return normalizedProducts.map(product => {
    const key = normalizeProductDescriptionKey(product.description);
    if (!key) return product;

    const group = groups.get(key);
    if (!group || group.length < 2) return product;

    const pieceCount = canonicalPieceCount.get(key);
    if (pieceCount === undefined) return product;

    return {
      ...product,
      stock: Number(fromPieceCount(pieceCount, product).toFixed(2)),
    };
  });
}

/** Shown in lists when description has no embedded pack size. */
export function formatDescriptionWithPack(description?: string) {
  const text = (description || '').trim();
  if (!text) return 'No description';
  const pack = getPackCountFromDescription(text);
  if (!pack) return text;
  return `${text} · ${pack} pcs/pack`;
}
