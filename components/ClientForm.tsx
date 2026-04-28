
import React, { useState } from 'react';
import type { Client, User } from '../types';

interface ClientFormProps {
  onAddClient: (newClient: Omit<Client, 'id' | 'location' | 'visits'> & { address: string, companyPin?: string }) => void;
  onCancel: () => void;
  salesReps: User[];
  userRole: User['role'];
  currentUserId: number;
}

export const ClientForm: React.FC<ClientFormProps> = ({ onAddClient, onCancel, salesReps, userRole, currentUserId }) => {
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [companyPin, setCompanyPin] = useState('');
  const [isSupplier, setIsSupplier] = useState(false);
  const [supplierCategory, setSupplierCategory] = useState('');
  const [salesRepId, setSalesRepId] = useState<number>(currentUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !name.trim() || !address.trim()) {
      alert('Company name, contact name, and address are required.');
      return;
    }
    onAddClient({
      company,
      name,
      salesRepId: userRole === 'Admin' ? salesRepId : currentUserId,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address,
      companyPin: companyPin.trim() || undefined,
      isSupplier: isSupplier || undefined,
      supplierCategory: isSupplier ? (supplierCategory.trim() || undefined) : undefined,
    });
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Add New Client</h2>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
              <input type="text" id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="companyPin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company PIN (Optional)</label>
              <input 
                type="text" 
                id="companyPin" 
                value={companyPin} 
                onChange={(e) => setCompanyPin(e.target.value)} 
                className="input-field" 
                placeholder="e.g. 1234"
                maxLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">Business verification code for this company.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSupplier}
                  onChange={(e) => setIsSupplier(e.target.checked)}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">This company is a Supplier</span>
              </label>
              {isSupplier && (
                <div className="mt-3">
                  <label htmlFor="supplierCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Category (Optional)</label>
                  <input
                    type="text"
                    id="supplierCategory"
                    value={supplierCategory}
                    onChange={(e) => setSupplierCategory(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Raw Materials, Packaging, Transport, Services"
                  />
                </div>
              )}
            </div>
        </div>
        <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" required />
        </div>
        {userRole === 'Admin' && (
            <div>
                <label htmlFor="salesRep" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Sales Representative</label>
                <select id="salesRep" value={salesRepId} onChange={(e) => setSalesRepId(Number(e.target.value))} className="input-field" required>
                    {salesReps.map(rep => (
                        <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                </select>
            </div>
        )}
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">Save Client</button>
        </div>
      </form>
    </div>
  );
};
