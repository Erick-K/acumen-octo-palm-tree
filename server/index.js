import express from 'express';
import cors from 'cors';
import multer from 'multer';
import XLSX from 'xlsx';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ----- Excel Import -----

function parseExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

app.post('/api/excel/import/products', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const rows = parseExcelBuffer(req.file.buffer);
    const headers = Object.keys(rows[0] || {}).map(h => String(h).trim().toLowerCase());
    const expectedHeaders = ['id', 'name', 'description', 'price', 'stock', 'category'];
    const hasAll = expectedHeaders.every(h => headers.includes(h));
    if (!hasAll) {
      return res.status(400).json({ error: `Invalid Excel header. Must contain: ${expectedHeaders.join(', ')}` });
    }
    const products = rows.map((row, i) => {
      const get = (k) => row[k] ?? row[Object.keys(row).find(kk => String(kk).trim().toLowerCase() === k)] ?? '';
      const id = parseInt(get('id'), 10);
      const price = parseFloat(get('price'));
      const stock = parseInt(get('stock'), 10);
      if (isNaN(id) || isNaN(price) || isNaN(stock) || !get('name') || !get('category')) {
        throw new Error(`Row ${i + 2}: Invalid or missing data`);
      }
      return {
        id,
        name: String(get('name')).trim(),
        description: String(get('description') || '').trim(),
        price,
        stock,
        category: String(get('category')).trim(),
        imageUrl: get('imageurl') || get('imageUrl') ? String(get('imageurl') || get('imageUrl')).trim() : undefined,
      };
    });
    res.json({ data: products });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Import failed' });
  }
});

app.post('/api/excel/import/clients', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const rows = parseExcelBuffer(req.file.buffer);
    const headers = Object.keys(rows[0] || {}).map(h => String(h).trim().toLowerCase());
    const required = ['id', 'company', 'name', 'salesrepid', 'address'];
    const hasAll = required.every(h => headers.includes(h));
    if (!hasAll) {
      return res.status(400).json({ error: `Invalid Excel header. Must contain: ${required.join(', ')}` });
    }
    const clients = rows.map((row, i) => {
      const get = (k) => row[k] ?? row[Object.keys(row).find(kk => String(kk).trim().toLowerCase() === k)] ?? '';
      const id = parseInt(get('id'), 10);
      const salesRepId = parseInt(get('salesrepid') || get('salesRepId'), 10);
      if (isNaN(id) || isNaN(salesRepId) || !get('company') || !get('name') || !get('address')) {
        throw new Error(`Row ${i + 2}: Invalid or missing data`);
      }
      return {
        id,
        company: String(get('company')).trim(),
        name: String(get('name')).trim(),
        salesRepId,
        address: String(get('address')).trim(),
        companyPin: get('companypin') || get('companyPin') ? String(get('companypin') || get('companyPin')).trim() : undefined,
        email: get('email') ? String(get('email')).trim() : undefined,
        phone: get('phone') ? String(get('phone')).trim() : undefined,
      };
    });
    res.json({ data: clients });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Import failed' });
  }
});

// ----- Excel Export -----

app.post('/api/excel/export/products', (req, res) => {
  try {
    const products = req.body.data || req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'No products to export' });
    }
    const headers = ['id', 'name', 'description', 'category', 'price', 'stock', 'imageUrl', 'variations'];
    const rows = products.map(p => [
      p.id,
      p.name,
      p.description,
      p.category,
      p.price,
      p.stock,
      p.imageUrl || '',
      (p.variations && Array.isArray(p.variations)) ? p.variations.map(v => `${v.name}:${(v.options || []).join('|')}`).join(';') : '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename=products-export-${date}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Export failed' });
  }
});

app.post('/api/excel/export/clients', (req, res) => {
  try {
    const clients = req.body.data || req.body;
    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ error: 'No clients to export' });
    }
    const headers = ['id', 'company', 'name', 'salesRepId', 'email', 'phone', 'address', 'companyPin'];
    const rows = clients.map(c => [
      c.id,
      c.company,
      c.name,
      c.salesRepId,
      c.email || '',
      c.phone || '',
      (c.location && c.location.address) || c.address || '',
      c.companyPin || '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename=clients-export-${date}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Export failed' });
  }
});

app.post('/api/excel/export/orders', (req, res) => {
  try {
    const { orders = [], clients = [] } = req.body;
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: 'No orders to export' });
    }
    const clientMap = new Map((clients || []).map(c => [c.id, c]));
    const headers = ['Order ID', 'Client', 'Date', 'Total', 'Status'];
    const rows = orders.map(o => {
      const client = clientMap.get(o.clientId);
      return [o.id, (client && client.company) || 'N/A', o.date, o.total, o.status];
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename=orders-export-${date}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Export failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Excel API server running at http://localhost:${PORT}`);
});
