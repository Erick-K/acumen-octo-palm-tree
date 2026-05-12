
import React, { useState, useMemo } from 'react';
import type { Order, Client, Product, OrderItem, User } from '../types';
import { OrderForm } from './OrderForm';
import { WarningIcon, TrashIcon, PencilSquareIcon } from './icons';
import { exportOrdersExcel, downloadExcel } from '../lib/excelApi';
import { formatKes } from '../lib/formatCurrency';
import { LPO } from './LPO';

interface OrdersProps {
  orders: Order[];
  clients: Client[];
  products: Product[];
  salesRepId: number;
  salesReps?: User[];
  onPlaceOrder: (newOrder: { clientId: number; items: OrderItem[]; total: number; salesRepId: number; date: string; isPaid?: boolean }) => Order;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
}

// Maximum allowed outstanding balance per client (sum of non-delivered / non-cancelled orders)
const MAX_OUTSTANDING_PER_CLIENT = 500000; // e.g. 500,000 KES

const getOrderStatusColor = (status: Order['status']) => {
    switch (status) {
        case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'Shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
};

const calculateClientOutstanding = (orders: Order[], clientId: number, excludeOrderId?: string) => {
    return orders
        .filter(o => 
            o.clientId === clientId &&
            o.status !== 'Delivered' &&
            o.status !== 'Cancelled' &&
            !o.isPaid && // Only count unpaid orders
            (!excludeOrderId || o.id !== excludeOrderId)
        )
        .reduce((sum, o) => sum + o.total, 0);
};

const DeleteConfirmationModal: React.FC<{
    order: Order;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ order, onCancel, onConfirm }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true" role="dialog">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
            <div className="flex">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-900/30">
                    <WarningIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white" id="modal-title">
                        Delete Order
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete order <span className="font-bold">{order.id}</span>? This action is permanent and cannot be undone.
                        </p>
                    </div>
                </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                    type="button"
                    onClick={onConfirm}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                    Confirm Delete
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);


export const Orders: React.FC<OrdersProps> = ({ orders, clients, products, salesRepId, salesReps = [], onPlaceOrder, onUpdateOrder, onDeleteOrder }) => {
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [orderForLPO, setOrderForLPO] = useState<Order | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    
    // Filtering State
    const [selectedClientId, setSelectedClientId] = useState<number | 'all'>('all');
    const [selectedStatuses, setSelectedStatuses] = useState<Order['status'][]>([]);

    const allStatuses: Order['status'][] = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

    const toggleStatus = (status: Order['status']) => {
        setSelectedStatuses(prev => 
            prev.includes(status) 
                ? prev.filter(s => s !== status) 
                : [...prev, status]
        );
    };

    const sortedOrders = useMemo(() => {
        let result = [...orders];

        // Filter by Client
        if (selectedClientId !== 'all') {
            result = result.filter(o => o.clientId === selectedClientId);
        }

        // Filter by Status
        if (selectedStatuses.length > 0) {
            result = result.filter(o => selectedStatuses.includes(o.status));
        }

        if (sortConfig !== null) {
            result.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'client') {
                    aValue = clients.find(c => c.id === a.clientId)?.company || '';
                    bValue = clients.find(c => c.id === b.clientId)?.company || '';
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                } else {
                    aValue = a[sortConfig.key as keyof Order];
                    bValue = b[sortConfig.key as keyof Order];
                }

                if (typeof aValue === 'string' && sortConfig.key !== 'date' && sortConfig.key !== 'client') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return result;
    }, [orders, sortConfig, clients, selectedClientId, selectedStatuses]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: string) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };
    
    const handleSaveOrder = (orderData: { clientId: number; items: OrderItem[]; total: number; salesRepId: number; date: string; isPaid?: boolean }) => {
        const existingOutstanding = calculateClientOutstanding(
            orders,
            orderData.clientId,
            editingOrder ? editingOrder.id : undefined
        );
        // Only add to outstanding if order is not paid
        const newOutstanding = existingOutstanding + (orderData.isPaid ? 0 : orderData.total);

        if (newOutstanding > MAX_OUTSTANDING_PER_CLIENT) {
            alert(
                `This customer has reached the order limit.\n\n` +
                `Current outstanding: ${formatKes(existingOutstanding)}\n` +
                `This order total: ${formatKes(orderData.total)}\n` +
                `Limit: ${formatKes(MAX_OUTSTANDING_PER_CLIENT)}`
            );
            return;
        }

        if (editingOrder) {
            onUpdateOrder({
                ...editingOrder,
                ...orderData
            });
            setEditingOrder(null);
        } else {
            const created = onPlaceOrder(orderData);
            setOrderForLPO(created);
            setShowOrderForm(false);
        }
    }

    const handleTogglePayment = (order: Order) => {
        onUpdateOrder({
            ...order,
            isPaid: !order.isPaid
        });
    };

    const handleDeleteConfirm = () => {
        if (orderToDelete) {
            onDeleteOrder(orderToDelete.id);
            setOrderToDelete(null);
        }
    };

    const handleExportCSV = () => {
        if (sortedOrders.length === 0) {
            alert("No orders to export.");
            return;
        }
        const csvHeaders = ["Order ID", "Client", "Date", "Total", "Status"];
        const escapeCsvField = (field: any): string => {
            const stringField = String(field);
            if (stringField.includes(',')) return `"${stringField.replace(/"/g, '""')}"`;
            return stringField;
        };
        const csvRows = sortedOrders.map(order => {
            const client = clients.find(c => c.id === order.clientId);
            return [escapeCsvField(order.id), escapeCsvField(client?.company || 'N/A'), order.date, order.total.toFixed(2), escapeCsvField(order.status)].join(',');
        });
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const date = new Date().toISOString().slice(0, 10);
        downloadExcel(blob, `orders-export-${date}.csv`);
    };

    const handleExportExcel = async () => {
        if (sortedOrders.length === 0) { alert("No orders to export."); return; }
        try {
            const blob = await exportOrdersExcel(sortedOrders, clients);
            const date = new Date().toISOString().slice(0, 10);
            downloadExcel(blob, `orders-export-${date}.xlsx`);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Excel export failed.');
        }
    };

    if (showOrderForm || editingOrder) {
        return <div className="p-4 sm:p-6 lg:p-8">
            <OrderForm 
                clients={clients} 
                products={products} 
                salesRepId={salesRepId} 
                initialOrder={editingOrder || undefined}
                onSave={handleSaveOrder} 
                onCancel={() => { setShowOrderForm(false); setEditingOrder(null); }}
            />
        </div>
    }

  return (
    <>
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
             <div className="w-full lg:w-auto">
                <label htmlFor="client-filter" className="sr-only">Filter by Client</label>
                <select
                    id="client-filter"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="block w-full lg:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="all">All Clients</option>
                    {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.company}</option>
                    ))}
                </select>
             </div>
             <div className="flex flex-wrap gap-2">
                {allStatuses.map(status => (
                    <button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                            selectedStatuses.includes(status)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {status}
                    </button>
                ))}
                {selectedStatuses.length > 0 && (
                    <button 
                        onClick={() => setSelectedStatuses([])}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline ml-2"
                    >
                        Clear
                    </button>
                )}
             </div>
        </div>
        <div className="flex items-center justify-end space-x-3">
            <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
            Export CSV
            </button>
            <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
            Export Excel
            </button>
            <button
                onClick={() => setShowOrderForm(true)}
                className="px-4 py-2 text-sm font-bold text-blue-900 bg-yellow-500 border border-transparent rounded-md shadow-sm hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
            New Order
            </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th 
                            scope="col" 
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 select-none"
                            onClick={() => requestSort('id')}
                        >
                            Order ID {getSortIndicator('id')}
                        </th>
                        <th 
                            scope="col" 
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 select-none"
                            onClick={() => requestSort('client')}
                        >
                            Client {getSortIndicator('client')}
                        </th>
                        <th 
                            scope="col" 
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 select-none"
                            onClick={() => requestSort('date')}
                        >
                            Date {getSortIndicator('date')}
                        </th>
                        <th 
                            scope="col" 
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 select-none"
                            onClick={() => requestSort('total')}
                        >
                            Total {getSortIndicator('total')}
                        </th>
                        <th 
                            scope="col" 
                            className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 select-none"
                            onClick={() => requestSort('status')}
                        >
                            Status {getSortIndicator('status')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Payment</th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {sortedOrders.map((order) => {
                        const client = clients.find(c => c.id === order.clientId);
                        const isEditable = !['Shipped', 'Delivered'].includes(order.status);
                        return (
                        <tr key={order.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{order.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">{client?.company || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">{order.date}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">{formatKes(order.total)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                    onClick={() => handleTogglePayment(order)}
                                    className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                                        order.isPaid
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                                    }`}
                                    title={order.isPaid ? 'Click to mark as Not Paid' : 'Click to mark as Paid'}
                                >
                                    {order.isPaid ? 'Paid' : 'Not Paid'}
                                </button>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                <button 
                                    onClick={() => setOrderForLPO(order)} 
                                    className="mr-3 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" 
                                    aria-label={`Generate LPO for order ${order.id}`}
                                    title="Generate LPO"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>
                                {isEditable && (
                                    <button onClick={() => setEditingOrder(order)} className="mr-3 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" aria-label={`Edit order ${order.id}`}>
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => setOrderToDelete(order)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" aria-label={`Delete order ${order.id}`}>
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
      </div>
    </div>
    {orderToDelete && (
        <DeleteConfirmationModal
            order={orderToDelete}
            onCancel={() => setOrderToDelete(null)}
            onConfirm={handleDeleteConfirm}
        />
    )}
    {orderForLPO && (
        <LPO
            order={orderForLPO}
            client={clients.find(c => c.id === orderForLPO.clientId)}
            products={products}
            salesRep={salesReps.find(r => r.id === orderForLPO.salesRepId)}
            onClose={() => setOrderForLPO(null)}
        />
    )}
    </>
  );
};
