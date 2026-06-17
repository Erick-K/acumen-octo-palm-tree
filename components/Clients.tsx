
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Client, Visit, User, Order } from '../types';
import { CalendarDaysIcon, PencilSquareIcon, EnvelopeIcon, PhoneIcon } from './icons';
import { ClientForm } from './ClientForm';
import { importClientsExcel, exportClientsExcel, downloadExcel } from '../lib/excelApi';
import { formatKes } from '../lib/formatCurrency';
import { KENYAN_ADDRESS_SUGGESTIONS } from '../data/kenyanLocations';
import { clientHasNoPin, isValidKraPin, normalizeKraPin } from '../lib/kraPin';

interface ClientsProps {
  clients: Client[];
  orders: Order[];
  salesReps: User[];
  onAddVisit: (clientId: number, notes: string) => void;
  onUpdateClient: (client: Client) => void;
  onAddClient: (newClientData: Omit<Client, 'id' | 'location' | 'visits'> & { address: string }) => void;
  onImportClients: (clients: Array<Omit<Client, 'location' | 'visits'> & { address: string }>) => void;
  userRole: User['role'];
  currentUserId: number;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ClientListItem: React.FC<{
    client: Client;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ client, isSelected, onSelect }) => (
    <button
        onClick={onSelect}
        className={`w-full text-left p-4 rounded-lg transition-colors duration-200 ${
            isSelected 
            ? 'bg-blue-100 dark:bg-blue-900/50 border-l-4 border-yellow-500' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border-l-4 border-transparent'
        }`}
    >
        <p className="font-semibold text-gray-900 dark:text-white">{client.company}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{client.name}</p>
    </button>
);


const ClientDetails: React.FC<{
    client: Client;
    onAddVisit: (clientId: number, notes: string) => void;
    onUpdateClient: (client: Client) => void;
    outstandingBalance: number;
}> = ({ client, onAddVisit, onUpdateClient, outstandingBalance }) => {
    const [visitNotes, setVisitNotes] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedClient, setEditedClient] = useState(client);
    const [isSupplier, setIsSupplier] = useState<boolean>(client.isSupplier ?? false);
    const [supplierCategory, setSupplierCategory] = useState<string>(client.supplierCategory ?? '');
    const [pinNotAvailable, setPinNotAvailable] = useState<boolean>(client.pinNotAvailable ?? clientHasNoPin(client));

    useEffect(() => {
        // Reset form when selected client changes
        setEditedClient(client);
        setIsSupplier(client.isSupplier ?? false);
        setSupplierCategory(client.supplierCategory ?? '');
        setPinNotAvailable(client.pinNotAvailable ?? clientHasNoPin(client));
        setIsEditing(false);
    }, [client]);

    const handleLogVisit = () => {
        onAddVisit(client.id, visitNotes);
        setVisitNotes('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditedClient(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setEditedClient(prev => ({
            ...prev,
            location: {
                ...prev.location,
                address: value
            }
        }));
    };

    const handleSave = () => {
        const normalizedCompanyPin = normalizeKraPin(editedClient.companyPin);
        if (!pinNotAvailable && normalizedCompanyPin && !isValidKraPin(normalizedCompanyPin)) {
            alert('Company PIN must be 1 letter, 9 numbers, and 1 final letter (example: P051188806D).');
            return;
        }
        onUpdateClient({
            ...editedClient,
            companyPin: pinNotAvailable ? undefined : normalizedCompanyPin || undefined,
            pinNotAvailable: pinNotAvailable || undefined,
            isSupplier: isSupplier || undefined,
            supplierCategory: isSupplier ? (supplierCategory.trim() || undefined) : undefined,
        });
        setIsEditing(false);
    };

    const handlePinAvailabilityChange = (checked: boolean) => {
        setPinNotAvailable(checked);
        if (checked) {
            setEditedClient(prev => ({ ...prev, companyPin: undefined }));
        }
    };

    return (
        <div className="space-y-6">
            {isEditing ? (
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Client Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                            <input type="text" name="company" id="company" value={editedClient.company} onChange={handleInputChange} className="input-field" />
                        </div>
                        <div>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pinNotAvailable}
                                    onChange={(e) => handlePinAvailabilityChange(e.target.checked)}
                                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Client has no KRA PIN</span>
                            </label>
                        </div>
                        {!pinNotAvailable && (
                            <div>
                                <label htmlFor="companyPin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company PIN (Optional)</label>
                                <input type="text" name="companyPin" id="companyPin" value={editedClient.companyPin || ''} onChange={(e) => setEditedClient(prev => ({ ...prev, companyPin: e.target.value.toUpperCase() }))} className="input-field" maxLength={11} placeholder="P051188806D" />
                            </div>
                        )}
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Name</label>
                            <input type="text" name="name" id="name" value={editedClient.name} onChange={handleInputChange} className="input-field" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" name="email" id="email" value={editedClient.email || ''} onChange={handleInputChange} className="input-field" />
                        </div>
                         <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                            <input type="tel" name="phone" id="phone" value={editedClient.phone || ''} onChange={handleInputChange} className="input-field" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                            <input
                              type="text"
                              name="address"
                              id="address"
                              list="kenya-address-hints-client-edit"
                              value={editedClient.location.address}
                              onChange={handleAddressChange}
                              className="input-field"
                            />
                            <datalist id="kenya-address-hints-client-edit">
                              {KENYAN_ADDRESS_SUGGESTIONS.map(line => (
                                <option key={line} value={line} />
                              ))}
                            </datalist>
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isSupplier}
                                    onChange={(e) => setIsSupplier(e.target.checked)}
                                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">This company is a Supplier</span>
                            </label>
                        </div>
                        {isSupplier && (
                            <div className="md:col-span-2">
                                <label htmlFor="supplierCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier Category</label>
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
                    <div className="flex justify-end space-x-3 mt-4">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400">Save</button>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{client.company}</h2>
                            <p className="text-md text-gray-600 dark:text-gray-400">{client.name}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {client.isSupplier && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                        Supplier{client.supplierCategory ? `: ${client.supplierCategory}` : ''}
                                    </span>
                                )}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                    outstandingBalance > 0
                                        ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                                        : 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                }`}>
                                    Outstanding: {formatKes(outstandingBalance)}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button onClick={() => setIsEditing(true)} className="flex items-center px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/50">
                                <PencilSquareIcon className="w-4 h-4 mr-2"/>
                                Edit
                            </button>
                            {client.companyPin && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                                    PIN: {client.companyPin}
                                </span>
                            )}
                            {clientHasNoPin(client) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                    No KRA PIN
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{client.location.address}</p>
                        <div className="flex flex-wrap gap-4 mt-2">
                            {client.email && (
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                                    <a href={`mailto:${client.email}`} className="text-blue-500 hover:underline">{client.email}</a>
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <PhoneIcon className="w-4 h-4 mr-2" />
                                    <span>{client.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Log New Visit</h3>
                <div className="mt-4">
                    <label htmlFor="visitNotes" className="sr-only">Visit Notes</label>
                    <textarea
                        id="visitNotes"
                        rows={4}
                        className="input-field"
                        placeholder="Add notes from your visit..."
                        value={visitNotes}
                        onChange={(e) => setVisitNotes(e.target.value)}
                    />
                </div>
                <div className="mt-3 text-right">
                    <button
                        onClick={handleLogVisit}
                        className="inline-flex items-center px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                        Log Visit
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visit History</h3>
                {client.visits && client.visits.length > 0 ? (
                     <div className="mt-4 space-y-4">
                        {client.visits.map((visit) => (
                            <div key={visit.id} className="relative p-4 pl-10 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full top-4 left-3 dark:bg-blue-900">
                                    <CalendarDaysIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{formatDate(visit.date)}</p>
                                {visit.notes ? (
                                    <p className="mt-1 text-sm text-gray-800 dark:text-gray-100">{visit.notes}</p>
                                ) : (
                                    <p className="mt-1 text-sm italic text-gray-500 dark:text-gray-400">No notes were recorded for this visit.</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No visits have been logged for this client yet.</p>
                )}
            </div>
        </div>
    );
};


export const Clients: React.FC<ClientsProps> = ({ clients, orders, salesReps, onAddVisit, onUpdateClient, onAddClient, onImportClients, userRole, currentUserId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRepId, setFilterRepId] = useState<'all' | number>('all');
    const [filterActivity, setFilterActivity] = useState<'all' | 'inactive'>('all');
    const [sortConfig, setSortConfig] = useState<string>('company-asc');
    const [showAddForm, setShowAddForm] = useState(false);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredClients = useMemo(() => {
        let tempClients = [...clients];

        // Apply sales rep filter (only for Admins)
        if (userRole === 'Admin' && filterRepId !== 'all') {
            tempClients = tempClients.filter(client => client.salesRepId === filterRepId);
        }

        // Apply search term filter
        if (searchTerm.trim()) {
            const lowercasedTerm = searchTerm.toLowerCase();
            tempClients = tempClients.filter(client =>
                client.company.toLowerCase().includes(lowercasedTerm) ||
                client.name.toLowerCase().includes(lowercasedTerm) ||
                (client.email && client.email.toLowerCase().includes(lowercasedTerm))
            );
        }
        
        // Apply activity filter
        if (filterActivity === 'inactive') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            tempClients = tempClients.filter(client => {
                if (!client.visits || client.visits.length === 0) {
                    return true; // Inactive if no visits ever
                }
                const mostRecentVisitDate = new Date(Math.max(...client.visits.map(v => new Date(v.date).getTime())));
                return mostRecentVisitDate < thirtyDaysAgo;
            });
        }

        // Apply sorting
        const [field, direction] = sortConfig.split('-');
        tempClients.sort((a, b) => {
            let comparison = 0;
            
            if (field === 'company') {
                comparison = a.company.localeCompare(b.company);
            } else if (field === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (field === 'lastVisit') {
                const getLastVisitTime = (client: Client) => {
                    if (!client.visits || client.visits.length === 0) return 0;
                    return Math.max(...client.visits.map(v => new Date(v.date).getTime()));
                };
                comparison = getLastVisitTime(a) - getLastVisitTime(b);
            }

            return direction === 'asc' ? comparison : -comparison;
        });

        return tempClients;
    }, [clients, filterRepId, searchTerm, userRole, filterActivity, sortConfig]);
    
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

    useEffect(() => {
        if (filteredClients.length > 0 && !filteredClients.some(c => c.id === selectedClientId)) {
            setSelectedClientId(filteredClients[0].id);
        } else if (filteredClients.length === 0) {
            setSelectedClientId(null);
        }
    }, [filteredClients, selectedClientId]);

    const selectedClient = useMemo(
        () => filteredClients.find(c => c.id === selectedClientId),
        [filteredClients, selectedClientId]
    );

    const outstandingByClientId = useMemo(() => {
        const map = new Map<number, number>();
        orders.forEach(o => {
            if (o.status === 'Delivered' || o.status === 'Cancelled') return;
            if (o.isPaid) return;
            map.set(o.clientId, (map.get(o.clientId) || 0) + o.total);
        });
        return map;
    }, [orders]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setFilterRepId(value === 'all' ? 'all' : Number(value));
    };

    const handleClientAdded = (newClientData: Omit<Client, 'id' | 'location' | 'visits'> & { address: string }) => {
        onAddClient(newClientData);
        setShowAddForm(false);
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
                const { data } = await importClientsExcel(file);
                onImportClients(data);
                setNotification({ type: 'success', message: `${data.length} clients were successfully imported/updated from Excel.` });
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
                const lines = text.trim().split('\n');
                const headerLine = lines.shift()?.trim();
                if (!headerLine) throw new Error('CSV file is empty or has no header.');
                const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
                const hasAllRequiredHeaders = ['id', 'company', 'name', 'salesrepid', 'address'].every(h => headers.includes(h));
                if (!hasAllRequiredHeaders) throw new Error(`Invalid CSV header. Must at least contain: id, company, name, salesRepId, address`);
                const importedClientsData: Array<Omit<Client, 'location' | 'visits'> & { address: string }> = lines.map((line, index) => {
                    const values = line.split(',');
                    const clientData: any = {};
                    headers.forEach((header, i) => {
                        const key = header === 'salesrepid' ? 'salesRepId' : (header === 'companypin' ? 'companyPin' : header);
                        clientData[key] = values[i]?.trim() || '';
                    });
                    const id = parseInt(clientData.id, 10);
                    const salesRepId = parseInt(clientData.salesRepId, 10);
                    if (isNaN(id) || isNaN(salesRepId) || !clientData.company || !clientData.name || !clientData.address) {
                        throw new Error(`Row ${index + 2}: Invalid or missing data.`);
                    }
                    const normalizedCompanyPin = normalizeKraPin(String(clientData.companyPin || ''));
                    if (normalizedCompanyPin && !isValidKraPin(normalizedCompanyPin)) {
                        throw new Error(`Row ${index + 2}: Company PIN must be 1 letter, 9 numbers, and 1 final letter (example: P051188806D).`);
                    }
                    return {
                        id,
                        company: clientData.company,
                        name: clientData.name,
                        companyPin: normalizedCompanyPin || undefined,
                        pinNotAvailable: !normalizedCompanyPin ? true : undefined,
                        salesRepId,
                        email: clientData.email || undefined,
                        phone: clientData.phone || undefined,
                        address: clientData.address,
                    };
                });
                onImportClients(importedClientsData);
                setNotification({ type: 'success', message: `${importedClientsData.length} clients were successfully imported/updated from CSV.` });
            } catch (error) {
                setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Import failed.' });
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.onerror = () => { setNotification({ type: 'error', message: 'Error reading file.' }); if (event.target) event.target.value = ''; };
        reader.readAsText(file);
    };

    if (showAddForm) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <ClientForm
                    onAddClient={handleClientAdded}
                    onCancel={() => setShowAddForm(false)}
                    salesReps={salesReps}
                    userRole={userRole}
                    currentUserId={currentUserId}
                />
                 <style>{`
                    .input-field {
                        display: block;
                        width: 100%;
                        padding: 0.5rem 0.75rem;
                        margin-top: 0.25rem;
                        font-size: 0.875rem;
                        line-height: 1.25rem;
                        color: #111827;
                        background-color: #ffffff;
                        border: 1px solid #d1d5db;
                        border-radius: 0.375rem;
                        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    }
                    .dark .input-field {
                        color: #ffffff;
                        background-color: #374151;
                        border-color: #4b5563;
                    }
                    .input-field:focus {
                        outline: 2px solid transparent;
                        outline-offset: 2px;
                        border-color: #eab308;
                        box-shadow: 0 0 0 2px #eab308;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
             <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-grow">
                    <label htmlFor="client-search" className="sr-only">Search Clients</label>
                    <input
                        id="client-search"
                        type="text"
                        placeholder="Search by company, name, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        aria-label="Search clients"
                    />
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-shrink-0">
                    {userRole === 'Admin' && (
                        <div>
                            <label htmlFor="rep-filter" className="sr-only">Filter by Rep</label>
                            <select
                                id="rep-filter"
                                value={filterRepId}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm md:w-48 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="all">All Reps</option>
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
                     <div>
                        <label htmlFor="activity-filter" className="sr-only">Filter by Status</label>
                        <select
                            id="activity-filter"
                            value={filterActivity}
                            onChange={(e) => setFilterActivity(e.target.value as 'all' | 'inactive')}
                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm md:w-48 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="all">All Statuses</option>
                            <option value="inactive">Inactive (30+ days)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="sort-select" className="sr-only">Sort by</label>
                        <select
                            id="sort-select"
                            value={sortConfig}
                            onChange={(e) => setSortConfig(e.target.value)}
                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm md:w-48 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="company-asc">Company (A-Z)</option>
                            <option value="company-desc">Company (Z-A)</option>
                            <option value="name-asc">Contact (A-Z)</option>
                            <option value="name-desc">Contact (Z-A)</option>
                            <option value="lastVisit-desc">Last Visit (Newest)</option>
                            <option value="lastVisit-asc">Last Visit (Oldest)</option>
                        </select>
                    </div>
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
                            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm md:w-auto hover:bg-blue-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                          Import CSV/Excel
                        </button>
                    )}
                    <button
                        onClick={async () => {
                            if (filteredClients.length === 0) { alert('No clients to export.'); return; }
                            setNotification(null);
                            try {
                                const blob = await exportClientsExcel(filteredClients);
                                const date = new Date().toISOString().slice(0, 10);
                                downloadExcel(blob, `clients-export-${date}.xlsx`);
                                setNotification({ type: 'success', message: 'Clients exported to Excel successfully.' });
                            } catch (error) {
                                setNotification({ type: 'error', message: error instanceof Error ? error.message : 'Excel export failed.' });
                            }
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm md:w-auto hover:bg-blue-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Export Excel
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm md:w-auto hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                        Add Client
                    </button>
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

            <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <div className="p-2 space-y-2 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 h-[60vh] overflow-y-auto">
                        {filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                                <ClientListItem 
                                    key={client.id}
                                    client={client}
                                    isSelected={client.id === selectedClientId}
                                    onSelect={() => setSelectedClientId(client.id)}
                                />
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full p-4 text-center text-gray-500 dark:text-gray-400">
                                No clients found.
                            </div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-2 h-[60vh] overflow-y-auto pr-2">
                    {selectedClient ? (
                        <ClientDetails
                            client={selectedClient}
                            onAddVisit={onAddVisit}
                            onUpdateClient={onUpdateClient}
                            outstandingBalance={outstandingByClientId.get(selectedClient.id) || 0}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">
                                {clients.length === 0 ? "No clients available. Try adding one." : "No clients match your search criteria."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
             <style>{`
                .input-field {
                    display: block;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    margin-top: 0.25rem;
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                    color: #111827;
                    background-color: #ffffff;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .dark .input-field {
                    color: #ffffff;
                    background-color: #374151;
                    border-color: #4b5563;
                }
                .input-field:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    border-color: #eab308;
                    box-shadow: 0 0 0 2px #eab308;
                }
            `}</style>
        </div>
    );
};
