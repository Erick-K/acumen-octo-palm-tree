
import React, { useState } from 'react';
import type { Product, ProductVariation } from '../types';
import { TrashIcon } from './icons';

interface ProductFormProps {
  initialProduct?: Product;
  onSave: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

// Helper type for form state
interface VariationFormState {
    name: string;
    options: string[];
    currentOptionInput: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialProduct, onSave, onCancel }) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [category, setCategory] = useState(initialProduct?.category || '');
  const [price, setPrice] = useState(initialProduct?.price?.toString() || '');
  const [stock, setStock] = useState(initialProduct?.stock?.toString() || '');
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');
  
  // Manage variations with explicit options array and an input buffer for new options
  const [variations, setVariations] = useState<VariationFormState[]>(
    initialProduct?.variations?.map(v => ({
        name: v.name,
        options: [...v.options],
        currentOptionInput: ''
    })) || []
  );

  const handleAddVariation = () => {
    setVariations([...variations, { name: '', options: [], currentOptionInput: '' }]);
  };

  const handleRemoveVariation = (index: number) => {
    const newVariations = [...variations];
    newVariations.splice(index, 1);
    setVariations(newVariations);
  };

  const handleVariationNameChange = (index: number, newName: string) => {
    const newVariations = [...variations];
    newVariations[index].name = newName;
    setVariations(newVariations);
  };

  const handleOptionInputChange = (index: number, value: string) => {
    const newVariations = [...variations];
    newVariations[index].currentOptionInput = value;
    setVariations(newVariations);
  };

  const handleAddOption = (index: number) => {
      const variation = variations[index];
      if (!variation.currentOptionInput.trim()) return;
      
      const newVariations = [...variations];
      newVariations[index].options = [...variation.options, variation.currentOptionInput.trim()];
      newVariations[index].currentOptionInput = '';
      setVariations(newVariations);
  };

  const handleRemoveOption = (variationIndex: number, optionIndex: number) => {
      const newVariations = [...variations];
      newVariations[variationIndex].options = newVariations[variationIndex].options.filter((_, i) => i !== optionIndex);
      setVariations(newVariations);
  };

  const handleKeyDownOption = (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleAddOption(index);
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
    
    // Parse variations back to data structure
    const validVariations: ProductVariation[] = variations
        .map(v => ({
            name: v.name.trim(),
            options: v.options
        }))
        .filter(v => v.name !== '' && v.options.length > 0);

    onSave({
      name,
      description,
      category,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      imageUrl: imageUrl.trim() || undefined,
      variations: validVariations.length > 0 ? validVariations : undefined,
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
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
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
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
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

        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product Variations</h3>
                <button
                    type="button"
                    onClick={handleAddVariation}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    + Add Variation
                </button>
            </div>
            
            {variations.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No variations added yet (e.g. Size, Color).</p>
            )}

            <div className="space-y-4">
                {variations.map((variation, index) => (
                    <div key={index} className="flex flex-col md:flex-row items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-md dark:bg-gray-700/30 dark:border-gray-600">
                        <div className="w-full md:w-1/3">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Variation Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Size"
                                value={variation.name}
                                onChange={(e) => handleVariationNameChange(index, e.target.value)}
                                className="block w-full px-3 py-2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Options</label>
                            <div className="flex flex-wrap gap-2 mb-2 min-h-[1.5rem]">
                                {variation.options.length > 0 ? variation.options.map((option, optIndex) => (
                                    <span key={optIndex} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                        {option}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(index, optIndex)}
                                            className="ml-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100 focus:outline-none"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                )) : (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 py-1">No options added.</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add option (e.g. Red) & Enter"
                                    value={variation.currentOptionInput}
                                    onChange={(e) => handleOptionInputChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDownOption(index, e)}
                                    className="block flex-1 px-3 py-2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddOption(index)}
                                    disabled={!variation.currentOptionInput.trim()}
                                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRemoveVariation(index)}
                            className="mt-6 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                            title="Remove Variation"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
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
