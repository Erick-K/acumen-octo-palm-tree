type XLSXModule = typeof import('https://esm.sh/xlsx@0.18.5');
const KRA_PIN_REGEX = /^[A-Z]\d{9}[A-Z]$/;

let xlsxLoader: Promise<XLSXModule> | null = null;

async function getXLSX(): Promise<XLSXModule> {
  if (!xlsxLoader) {
    xlsxLoader = import('https://esm.sh/xlsx@0.18.5');
  }
  return xlsxLoader;
}

async function readExcelRows(file: File): Promise<Record<string, unknown>[]> {
  const XLSX = await getXLSX();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
}

function getRowValue(row: Record<string, unknown>, key: string): unknown {
  const direct = row[key];
  if (direct !== undefined) return direct;
  const matchedKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.trim().toLowerCase());
  return matchedKey ? row[matchedKey] : '';
}

function parseImportNumber(value: unknown): number {
  const normalized = String(value ?? '').replace(/,/g, '').replace(/[^\d.-]/g, '');
  return Number(normalized);
}

export async function importProductsExcel(file: File): Promise<{ data: import('../types').Product[] }> {
  const rows = await readExcelRows(file);
  const headers = Object.keys(rows[0] || {}).map(h => String(h).trim().toLowerCase());
  const required = ['name', 'price', 'stock', 'category'];
  if (!required.every(h => headers.includes(h))) {
    throw new Error(`Invalid Excel header. Must contain: ${required.join(', ')}`);
  }

  let nextGeneratedId = Date.now();
  const products = rows.map((row, i) => {
    const parsedId = parseInt(String(getRowValue(row, 'id')), 10);
    const id = Number.isFinite(parsedId) ? parsedId : ++nextGeneratedId;
    const price = parseImportNumber(getRowValue(row, 'price'));
    const stock = Math.trunc(parseImportNumber(getRowValue(row, 'stock')));
    const name = String(getRowValue(row, 'name')).trim();
    const category = String(getRowValue(row, 'category')).trim();
    if (isNaN(price) || isNaN(stock) || !name || !category) {
      throw new Error(`Row ${i + 2}: Invalid or missing data`);
    }

    const image = String(getRowValue(row, 'imageUrl') || getRowValue(row, 'imageurl') || '').trim();

    return {
      id,
      name,
      description: String(getRowValue(row, 'description') || '').trim(),
      price,
      stock,
      category,
      imageUrl: image || undefined,
    };
  });

  return { data: products };
}

type ImportedClientData = Omit<import('../types').Client, 'location' | 'visits'> & { address: string };

export async function importClientsExcel(file: File): Promise<{ data: ImportedClientData[] }> {
  const rows = await readExcelRows(file);
  const headers = Object.keys(rows[0] || {}).map(h => String(h).trim().toLowerCase());
  const required = ['id', 'company', 'name', 'salesrepid', 'address'];
  if (!required.every(h => headers.includes(h))) {
    throw new Error(`Invalid Excel header. Must contain: ${required.join(', ')}`);
  }

  const clients = rows.map((row, i) => {
    const id = parseInt(String(getRowValue(row, 'id')), 10);
    const salesRepId = parseInt(String(getRowValue(row, 'salesRepId') || getRowValue(row, 'salesrepid')), 10);
    const company = String(getRowValue(row, 'company')).trim();
    const name = String(getRowValue(row, 'name')).trim();
    const address = String(getRowValue(row, 'address')).trim();
    if (isNaN(id) || isNaN(salesRepId) || !company || !name || !address) {
      throw new Error(`Row ${i + 2}: Invalid or missing data`);
    }

    const companyPin = String(getRowValue(row, 'companyPin') || getRowValue(row, 'companypin') || '').trim().toUpperCase();
    const email = String(getRowValue(row, 'email') || '').trim();
    const phone = String(getRowValue(row, 'phone') || '').trim();
    if (companyPin && !KRA_PIN_REGEX.test(companyPin)) {
      throw new Error(`Row ${i + 2}: Company PIN must be 1 letter, 9 numbers, and 1 final letter (example: P051188806D).`);
    }

    return {
      id,
      company,
      name,
      salesRepId,
      address,
      companyPin: companyPin || undefined,
      email: email || undefined,
      phone: phone || undefined,
    };
  });

  return { data: clients };
}

export async function exportProductsExcel(products: import('../types').Product[]): Promise<Blob> {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('No products to export');
  }
  const XLSX = await getXLSX();
  const headers = ['id', 'name', 'description', 'category', 'price', 'stock', 'imageUrl', 'variations'];
  const rows = products.map(p => [
    p.id,
    p.name,
    p.description,
    p.category,
    p.price,
    p.stock,
    p.imageUrl || '',
    Array.isArray(p.variations) ? p.variations.map(v => `${v.name}:${(v.options || []).join('|')}`).join(';') : '',
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportClientsExcel(clients: import('../types').Client[]): Promise<Blob> {
  if (!Array.isArray(clients) || clients.length === 0) {
    throw new Error('No clients to export');
  }
  const XLSX = await getXLSX();
  const headers = ['id', 'company', 'name', 'salesRepId', 'email', 'phone', 'address', 'companyPin'];
  const rows = clients.map(c => [
    c.id,
    c.company,
    c.name,
    c.salesRepId,
    c.email || '',
    c.phone || '',
    c.location?.address || '',
    c.companyPin || '',
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportOrdersExcel(orders: import('../types').Order[], clients: import('../types').Client[]): Promise<Blob> {
  if (!Array.isArray(orders) || orders.length === 0) {
    throw new Error('No orders to export');
  }
  const XLSX = await getXLSX();
  const clientMap = new Map((clients || []).map(c => [c.id, c]));
  const headers = ['Order ID', 'Client', 'Date', 'Total', 'Status'];
  const rows = orders.map(o => [o.id, clientMap.get(o.clientId)?.company || 'N/A', o.date, o.total, o.status]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const downloadExcel = downloadBlob;
