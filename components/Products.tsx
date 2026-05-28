
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Product, User } from '../types';
import { WarningIcon, ArrowDownTrayIcon } from './icons';
import { ProductForm } from './ProductForm';
import { StockChart } from './StockChart';
import { importProductsExcel, exportProductsExcel, downloadExcel } from '../lib/excelApi';
import { formatKes } from '../lib/formatCurrency';

interface ProductsProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (newProductData: Omit<Product, 'id'>) => void;
  onImportProducts: (products: Product[]) => void;
  onDeleteProduct: (productId: number) => void;
  userRole: User['role'];
}

const getStockColor = (stock: number, lowThreshold: number) => {
    if (stock <= lowThreshold) return 'text-red-500 dark:text-red-400';
    if (stock < lowThreshold * 2) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
};

const StockIndicator: React.FC<{ stock: number, lowThreshold: number }> = ({ stock, lowThreshold }) => {
    const level = stock <= lowThreshold ? 'low' : stock < lowThreshold * 2 ? 'medium' : 'high';
    const color = level === 'low' ? 'bg-red-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
    return <div className={`w-3 h-3 rounded-full ${color}`}></div>;
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseCsvRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let current = '';
  let inQuotes = false;
  const normalized = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i += 1;
      currentRow.push(current);
      if (currentRow.some(value => value.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      current = '';
      continue;
    }

    current += char;
  }

  currentRow.push(current);
  if (currentRow.some(value => value.trim().length > 0)) {
    rows.push(currentRow);
  }

  return rows;
};

const normalizeCsvValues = (headers: string[], values: string[]): string[] => {
  if (values.length <= headers.length) return values;

  const descriptionIndex = headers.indexOf('description');
  if (descriptionIndex === -1) return values;

  const extraValueCount = values.length - headers.length;
  return [
    ...values.slice(0, descriptionIndex),
    values.slice(descriptionIndex, descriptionIndex + extraValueCount + 1).join(',').trim(),
    ...values.slice(descriptionIndex + extraValueCount + 1),
  ];
};

const parseImportNumber = (value: unknown): number => {
  const normalized = String(value ?? '').replace(/,/g, '').replace(/[^\d.-]/g, '');
  return Number(normalized);
};

export const Products: React.FC<ProductsProps> = ({ products, onUpdateProduct, onAddProduct, onImportProducts, onDeleteProduct, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [priceSort, setPriceSort] = useState<'default' | 'asc' | 'desc'>('default');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for image modal
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    try {
      const savedThreshold = localStorage.getItem('lowStockThreshold');
      return savedThreshold ? parseInt(savedThreshold, 10) : 50;
    } catch (error) {
      console.error("Failed to parse low stock threshold from localStorage", error);
      return 50;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('lowStockThreshold', String(lowStockThreshold));
    } catch (error) {
      console.error("Failed to save low stock threshold to localStorage", error);
    }
  }, [lowStockThreshold]);

  const categories = useMemo(() => [...new Set(products.map(p => p.category))].sort(), [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = [...products];

    if (categoryFilter !== 'all') {
        tempProducts = tempProducts.filter(p => p.category === categoryFilter);
    }

    if (searchTerm.trim()) {
        const lowercasedTerm = searchTerm.toLowerCase();
        tempProducts = tempProducts.filter(
            (product) =>
                product.name.toLowerCase().includes(lowercasedTerm) ||
                product.category.toLowerCase().includes(lowercasedTerm)
        );
    }

    if (priceSort === 'asc') {
        tempProducts.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'desc') {
        tempProducts.sort((a, b) => b.price - a.price);
    }

    return tempProducts;
  }, [products, searchTerm, categoryFilter, priceSort]);
  
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= lowStockThreshold);
  }, [products, lowStockThreshold]);

  const handleSaveProduct = (productData: Omit<Product, 'id'>) => {
    if (editingProduct) {
        onUpdateProduct({ ...productData, id: editingProduct.id });
        setEditingProduct(null);
        setNotification({ type: 'success', message: 'Product updated successfully.' });
    } else {
        onAddProduct(productData);
        setShowAddForm(false);
        setNotification({ type: 'success', message: 'Product added successfully.' });
    }
    setSearchTerm('');
    setCategoryFilter('all');
    setPriceSort('default');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotification(null);
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);

    if (isExcel) {
      try {
        const { data } = await importProductsExcel(file);
        onImportProducts(data);
        setSearchTerm('');
        setCategoryFilter('all');
        setPriceSort('default');
        setNotification({ type: 'success', message: `${data.length} products were successfully imported/updated from Excel.` });
      } catch (error) {
        setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Excel import failed.' });
      } finally {
        if (event.target) event.target.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            setNotification({ type: 'error', message: 'Failed to read file.' });
            return;
        }
        try {
            const rows = parseCsvRows(text);
            const headerRow = rows.shift();
            if (!headerRow) throw new Error('CSV file is empty or has no header.');
            const headers = headerRow.map(h => h.trim().toLowerCase());
            const expectedHeaders = ['name', 'price', 'stock', 'category'];
            const hasAllHeaders = expectedHeaders.every(h => headers.includes(h));
            if (!hasAllHeaders) throw new Error(`Invalid CSV header. Must contain: ${expectedHeaders.join(', ')}`);
            let nextGeneratedId = Math.max(0, ...products.map(p => p.id), Date.now());
            const importedProducts: Product[] = rows.map((row, index) => {
                const values = normalizeCsvValues(headers, row);
                if (values.length < headers.length) throw new Error(`Row ${index + 2}: Column count mismatch.`);
                const productData: any = {};
                headers.forEach((header, i) => { productData[header] = values[i]?.trim(); });
                const parsedId = parseInt(productData.id, 10);
                const id = Number.isFinite(parsedId) ? parsedId : ++nextGeneratedId;
                const price = parseImportNumber(productData.price);
                const stock = Math.trunc(parseImportNumber(productData.stock));
                if (isNaN(price) || isNaN(stock) || !productData.name || !productData.category) {
                    throw new Error(`Row ${index + 2}: Invalid or missing data.`);
                }
                return { id, name: productData.name, description: productData.description || '', price, stock, category: productData.category, imageUrl: productData.imageurl || undefined };
            });
            onImportProducts(importedProducts);
            setSearchTerm('');
            setCategoryFilter('all');
            setPriceSort('default');
            setNotification({ type: 'success', message: `${importedProducts.length} products were successfully imported/updated from CSV.` });
        } catch (error) {
            setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Import failed.' });
        } finally {
            if (event.target) event.target.value = '';
        }
    };
    reader.onerror = () => { setNotification({ type: 'error', message: 'Error reading file.' }); if (event.target) event.target.value = ''; };
    reader.readAsText(file);
  };

  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('excel');

  const handleExportCSV = () => {
    if (filteredAndSortedProducts.length === 0) {
      alert("No products to export.");
      return;
    }
    const csvHeaders = ["id", "name", "description", "category", "price", "stock", "imageUrl", "variations"];
    const escapeCsvField = (field: any): string => {
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) return `"${stringField.replace(/"/g, '""')}"`;
        return stringField;
    };
    const csvRows = filteredAndSortedProducts.map(p => {
        const variationsStr = p.variations ? p.variations.map(v => `${v.name}:${v.options.join('|')}`).join(';') : '';
        return [p.id, escapeCsvField(p.name), escapeCsvField(p.description), escapeCsvField(p.category), p.price, p.stock, escapeCsvField(p.imageUrl || ''), escapeCsvField(variationsStr)].join(',');
    });
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const date = new Date().toISOString().slice(0, 10);
    downloadExcel(blob, `products-export-${date}.csv`);
  };

  const handleExportExcel = async () => {
    if (filteredAndSortedProducts.length === 0) {
      alert("No products to export.");
      return;
    }
    setNotification(null);
    try {
      const blob = await exportProductsExcel(filteredAndSortedProducts);
      const date = new Date().toISOString().slice(0, 10);
      downloadExcel(blob, `products-export-${date}.xlsx`);
      setNotification({ type: 'success', message: 'Products exported to Excel successfully.' });
    } catch (error) {
      setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Excel export failed.' });
    }
  };

  const handleExport = () => exportFormat === 'excel' ? handleExportExcel() : handleExportCSV();

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    onDeleteProduct(productToDelete.id);
    setNotification({ type: 'success', message: `${productToDelete.name} was deleted.` });
    setProductToDelete(null);
  };


  if (showAddForm || editingProduct) {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <ProductForm 
                initialProduct={editingProduct || undefined}
                onSave={handleSaveProduct} 
                onCancel={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                }} 
            />
        </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {viewingImage && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm transition-opacity" 
            onClick={() => setViewingImage(null)}
        >
            <div className="relative animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                 <button
                    onClick={() => setViewingImage(null)}
                    className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 focus:outline-none sm:-right-10 sm:top-0"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <img 
                    src={viewingImage} 
                    alt="Product Full View" 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl bg-white dark:bg-gray-800" 
                />
            </div>
        </div>
      )}
      
      <StockChart products={products} lowStockThreshold={lowStockThreshold} />

      <div className="sm:flex sm:items-center sm:justify-between">
        <div />
        <div className="flex items-center mt-3 space-x-3 sm:mt-0 sm:ml-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect}
              className="hidden"
              accept=".csv,.xlsx,.xls"
            />
             {userRole === 'Admin' && (
                <button
                    onClick={handleImportClick}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Import CSV/Excel
                </button>
            )}
            <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export
            </button>
            {userRole === 'Admin' && (
                <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Add Product
                </button>
            )}
        </div>
      </div>

      {notification && (
        <div className={`mt-4 p-4 rounded-lg flex items-center justify-between ${notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-600' : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600'}`}>
            <p className={`text-sm ${notification.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{notification.message}</p>
            <button onClick={() => setNotification(null)} className={`p-1 -m-1 rounded-full ${notification.type === 'success' ? 'text-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800' : 'text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800'}`}>
                <span className="sr-only">Dismiss</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="mt-4 p-4 border rounded-lg bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <WarningIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Low Stock Alert</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  The following products are at or below the threshold of {lowStockThreshold} units:
                </p>
                <ul role="list" className="mt-2 pl-5 space-y-1 list-disc">
                  {lowStockProducts.map(p => (
                    <li key={p.id}>{p.name} <span className="font-semibold">({p.stock} units)</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 mt-4">
        <div className="flex-1 min-w-[200px]">
            <label htmlFor="product-search" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Search</label>
            <input
                id="product-search"
                type="text"
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
        </div>
        <div>
            <label htmlFor="category-filter" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Category</label>
            <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full max-w-xs px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>
        <div>
             <label htmlFor="price-sort" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Sort by Price</label>
             <select
                id="price-sort"
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value as 'default' | 'asc' | 'desc')}
                className="w-full max-w-xs px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                <option value="default">Default</option>
                <option value="asc">Price: Low to High</option>
                <option value="desc">Price: High to Low</option>
            </select>
        </div>
        <div>
            <label htmlFor="stock-threshold" className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Low Stock Alert</label>
            <div className="flex items-center">
                <input
                    type="number"
                    id="stock-threshold"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
                    className="w-24 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    min="0"
                />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">units</span>
            </div>
        </div>
      </div>
      <div className="mt-6 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Image</th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Product</th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Category</th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Price</th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Stock</th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {filteredAndSortedProducts.map((product) => (
                        <tr key={product.id} className={product.stock <= lowStockThreshold ? 'bg-red-50 dark:bg-red-900/20 transition-colors' : 'transition-colors'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex-shrink-0 w-16 h-16">
                                    <button 
                                        onClick={() => setViewingImage(product.imageUrl || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=No+Image')}
                                        className="focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded-md"
                                    >
                                        <img 
                                            className="object-cover w-16 h-16 rounded-md bg-gray-200 dark:bg-gray-700 hover:opacity-75 transition-opacity cursor-zoom-in" 
                                            src={product.imageUrl || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=No+Image'} 
                                            alt={product.name} 
                                        />
                                    </button>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{product.description}</div>
                                {product.variations && product.variations.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {product.variations.map((v, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                {v.name}: {v.options.join(', ')}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">{product.category}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">{formatKes(product.price)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <StockIndicator stock={product.stock} lowThreshold={lowStockThreshold} />
                                    <span className={`ml-2 text-sm font-semibold ${getStockColor(product.stock, lowStockThreshold)}`}>{product.stock} units</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                <button 
                                    onClick={() => setEditingProduct(product)} 
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Edit
                                </button>
                                {userRole === 'Admin' && (
                                  <button
                                    onClick={() => setProductToDelete(product)}
                                    className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Delete
                                  </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredAndSortedProducts.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No products match the current filters. Clear the search or choose All Categories to see recently added products.
                </div>
            )}
        </div>
      </div>
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-900/30">
                <WarningIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Delete Product</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Delete <span className="font-semibold">{productToDelete.name}</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
