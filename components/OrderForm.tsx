
import React, { useState, useMemo } from 'react';
import type { Client, Product, Order, OrderItem } from '../types';
import { formatKes } from '../lib/formatCurrency';

export interface OrderFormData {
  clientId: number;
  items: OrderItem[];
  total: number;
  salesRepId: number;
  date: string;
  isPaid?: boolean;
}

interface OrderFormProps {
  clients: Client[];
  products: Product[];
  salesRepId: number;
  initialOrder?: Order;
  initialDraftData?: OrderFormData;
  onSave: (orderData: OrderFormData) => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ clients, products, salesRepId, initialOrder, initialDraftData, onSave, onCancel }) => {
  const baseOrderData = initialOrder ?? initialDraftData;
  const [clientId, setClientId] = useState<number | ''>(baseOrderData?.clientId ?? '');
  const [items, setItems] = useState<OrderItem[]>(baseOrderData?.items ?? []);
  const [productToAdd, setProductToAdd] = useState<number | ''>('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState(baseOrderData?.date || new Date().toISOString().split('T')[0]);
  const [isPaid, setIsPaid] = useState<boolean>(baseOrderData?.isPaid ?? false);

  const handleAddItem = () => {
    if (!productToAdd || quantity <= 0) return;
    const product = products.find(p => p.id === productToAdd);
    if (!product) return;

    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    if (existingItemIndex > -1) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
      setItems(newItems);
    } else {
      setItems([...items, { productId: product.id, quantity, priceAtSale: product.price }]);
    }
    setProductToAdd('');
    setQuantity(1);
  };
  
  const handleRemoveItem = (productId: number) => {
    setItems(items.filter(item => item.productId !== productId));
  };
  
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.priceAtSale * item.quantity, 0);
  }, [items]);

  const normalizedProductSearch = productSearchTerm.trim().toLowerCase();
  const selectableProducts = useMemo(() => {
    return products.filter(product => {
      if (product.stock <= 0) return false;
      if (!normalizedProductSearch) return true;
      return (
        product.name.toLowerCase().includes(normalizedProductSearch) ||
        product.category.toLowerCase().includes(normalizedProductSearch) ||
        product.description.toLowerCase().includes(normalizedProductSearch)
      );
    });
  }, [products, normalizedProductSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || items.length === 0) {
      alert("Please select a client and add at least one product.");
      return;
    }
    onSave({ 
        clientId: Number(clientId), 
        items, 
        total, 
        salesRepId: initialOrder?.salesRepId ?? initialDraftData?.salesRepId ?? salesRepId,
        date,
        isPaid
    });
  };
  
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{initialOrder ? 'Edit Order' : 'New Order'}</h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Client</label>
              <select
                id="client"
                value={clientId}
                onChange={(e) => setClientId(Number(e.target.value))}
                className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="" disabled>-- Choose a client --</option>
                {clients.map(client => <option key={client.id} value={client.id}>{client.company}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Date</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as Paid</span>
              </label>
            </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-600">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Add Products</h3>
          <div className="mb-3">
            <label htmlFor="product-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Product</label>
            <input
              id="product-search"
              type="text"
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              placeholder="Type product name, category, or description..."
              className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label htmlFor="product" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
              <select id="product" value={productToAdd} onChange={(e) => setProductToAdd(Number(e.target.value))} className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="" disabled>-- Select a product --</option>
                {selectableProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({formatKes(p.price)}) - {p.stock} in stock</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qty</label>
              <input type="number" id="quantity" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="block w-24 px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <button type="button" onClick={handleAddItem} className="px-4 py-2 font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">Add</button>
          </div>
          {selectableProducts.length === 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              No products match your search. Try another keyword.
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Order Summary</h3>
            <ul className="mt-2 border border-gray-200 divide-y divide-gray-200 rounded-md dark:border-gray-600 dark:divide-gray-600">
              {items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <li key={item.productId} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.quantity} x {formatKes(item.priceAtSale)}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <p className="font-medium text-gray-900 dark:text-white">{formatKes(item.quantity * item.priceAtSale)}</p>
                        <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700">&times;</button>
                    </div>
                  </li>
                );
              })}
              <li className="flex items-center justify-between p-3 font-bold bg-gray-50 dark:bg-gray-700">
                <p className="text-gray-900 dark:text-white">Total</p>
                <p className="text-gray-900 dark:text-white">{formatKes(total)}</p>
              </li>
            </ul>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
            {initialOrder ? 'Update Order' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
};
