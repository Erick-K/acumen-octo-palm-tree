
import React, { useMemo, useState } from 'react';
import type { Product } from '../types';
import { getPackCountFromDescription } from '../lib/productPackaging';

interface ProductFormProps {
  initialProduct?: Product;
  onSave: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialProduct, onSave, onCancel }) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [category, setCategory] = useState(initialProduct?.category || '');
  const [price, setPrice] = useState(initialProduct?.price?.toString() || '');
  const [stock, setStock] = useState(initialProduct?.stock?.toString() || '');
  const [packagingUnit, setPackagingUnit] = useState<Product['packagingUnit']>(initialProduct?.packagingUnit || 'pieces');
  const [piecesPerOuter, setPiecesPerOuter] = useState((initialProduct?.piecesPerOuter ?? 1).toString());
  const [piecesPerCarton, setPiecesPerCarton] = useState((initialProduct?.piecesPerCarton ?? 1).toString());
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');

  const packFromDescription = useMemo(
    () => getPackCountFromDescription(description),
    [description]
  );

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    const pack = getPackCountFromDescription(value);
    if (pack) {
      setPiecesPerOuter(String(pack));
      setPiecesPerCarton(String(pack));
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim()) {
      alert('Product name and category are required.');
      return;
    }
    
    const packValue = packFromDescription;
    const outerValue = packValue ?? Math.max(1, parseInt(piecesPerOuter, 10) || 1);
    const cartonValue = packValue ?? Math.max(outerValue, parseInt(piecesPerCarton, 10) || 1);

    onSave({
      name,
      description,
      category,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      packagingUnit,
      piecesPerOuter: outerValue,
      piecesPerCarton: cartonValue,
      imageUrl: imageUrl.trim() || undefined,
    });
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {initialProduct ? 'Edit Product' : 'Add New Product'}
      </h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="e.g. 5sx40x41.3 — x40 means 40 pieces per outer/carton"
            className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {packFromDescription ? (
            <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
              Pack size from description: {packFromDescription} pieces per outer/carton
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Add pack size in the description (e.g. 5sx40x41.3 or 50mlx6) or set it below.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Image</label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Paste image URL or upload below"
          />
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="block w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
            />
            {imageUrl && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Preview:</span>
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="h-12 w-12 rounded-md object-cover border border-gray-200 dark:border-gray-600"
                />
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (KES)</label>
            <input
              type="number"
              id="price"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
            <input
              type="number"
              id="stock"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="0"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div>
            <label htmlFor="packagingUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Inventory Unit</label>
            <select
              id="packagingUnit"
              value={packagingUnit}
              onChange={(e) => setPackagingUnit(e.target.value as Product['packagingUnit'])}
              className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="pieces">Pieces</option>
              <option value="outers">Outers</option>
              <option value="cartons">Cartons</option>
            </select>
          </div>
          <div>
            <label htmlFor="piecesPerOuter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pieces Per Outer</label>
            <input
              type="number"
              id="piecesPerOuter"
              min="1"
              step="1"
              value={packFromDescription ?? piecesPerOuter}
              onChange={(e) => setPiecesPerOuter(e.target.value)}
              readOnly={Boolean(packFromDescription)}
              className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
            />
          </div>
          <div>
            <label htmlFor="piecesPerCarton" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pieces Per Carton</label>
            <input
              type="number"
              id="piecesPerCarton"
              min="1"
              step="1"
              value={packFromDescription ?? piecesPerCarton}
              onChange={(e) => setPiecesPerCarton(e.target.value)}
              readOnly={Boolean(packFromDescription)}
              className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
            />
          </div>
          <p className="sm:col-span-3 text-xs text-gray-500 dark:text-gray-400">
            Products with the same description share stock. Add one row per price — the highest price becomes cartons,
            the second highest outers, and the lowest pieces (outer/carton ordering is automatic).
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
            {initialProduct ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
