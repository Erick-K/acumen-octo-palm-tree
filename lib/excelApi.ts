const API_BASE = '/api';

export async function importProductsExcel(file: File): Promise<{ data: import('../types').Product[] }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/excel/import/products`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Import failed (${res.status})`);
  }
  return res.json();
}

type ImportedClientData = Omit<import('../types').Client, 'location' | 'visits'> & { address: string };

export async function importClientsExcel(file: File): Promise<{ data: ImportedClientData[] }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/excel/import/clients`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Import failed (${res.status})`);
  }
  return res.json();
}

export async function exportProductsExcel(products: import('../types').Product[]): Promise<Blob> {
  const res = await fetch(`${API_BASE}/excel/export/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: products }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Export failed (${res.status})`);
  }
  return res.blob();
}

export async function exportClientsExcel(clients: import('../types').Client[]): Promise<Blob> {
  const res = await fetch(`${API_BASE}/excel/export/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: clients }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Export failed (${res.status})`);
  }
  return res.blob();
}

export async function exportOrdersExcel(orders: import('../types').Order[], clients: import('../types').Client[]): Promise<Blob> {
  const res = await fetch(`${API_BASE}/excel/export/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders, clients }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Export failed (${res.status})`);
  }
  return res.blob();
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
