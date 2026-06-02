
import React, { useState } from 'react';
import type { Client, User } from '../types';
import { KENYAN_ADDRESS_SUGGESTIONS } from '../data/kenyanLocations';

const KRA_PIN_REGEX = /^[A-Z]\d{9}[A-Z]$/;

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
    const normalizedCompanyPin = companyPin.trim().toUpperCase();
    if (normalizedCompanyPin && !KRA_PIN_REGEX.test(normalizedCompanyPin)) {
      alert('Company PIN must be 1 letter, 9 numbers, and 1 final letter (example: P051188806D).');
      return;
    }
    onAddClient({
      company,
      name,
      salesRepId: userRole === 'Admin' ? salesRepId : currentUserId,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address,
      companyPin: normalizedCompanyPin || undefined,
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
                onChange={(e) => setCompanyPin(e.target.value.toUpperCase())} 
                className="input-field" 
                placeholder="e.g. P051188806D"
                maxLength={11}
              />
              <p className="mt-1 text-xs text-gray-500">KRA PIN format: 1 letter, 9 digits, then 1 letter (example: P051188806D).</p>
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
            <input
              type="text"
              id="address"
              list="kenya-town-address-hints"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
              placeholder="Town, County, Kenya (pick a suggestion or type your own)"
              required
            />
            <datalist id="kenya-town-address-hints">
              {KENYAN_ADDRESS_SUGGESTIONS.map(line => (
                <option key={line} value={line} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Suggestions cover major towns in all 47 counties.</p>
        </div>
        {userRole === 'Admin' && (
            <div>
                <label htmlFor="salesRep" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Sales Representative</label>
                <select id="salesRep" value={salesRepId} onChange={(e) => setSalesRepId(Number(e.target.value))} className="input-field" required>
                    {salesReps.map(rep => (
                        <option key={rep.id} value={rep.id}>
                          {rep.name}
                          {rep.workLocation?.town && rep.workLocation?.county
                            ? ` — ${rep.workLocation.town}, ${rep.workLocation.county}`
                            : ''}
                        </option>
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
