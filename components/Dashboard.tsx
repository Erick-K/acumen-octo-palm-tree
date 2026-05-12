
import React, { useState, useEffect } from 'react';
import type { Client, Product, Order, Task, ClockLog } from '../types';
import { formatKes } from '../lib/formatCurrency';
import { ClientMap } from './ClientMap';

interface DashboardProps {
  clients: Client[];
  products: Product[];
  orders: Order[];
  tasks: Task[];
  isClockedIn?: boolean;
  lastClockLog?: ClockLog;
}

const StatCard: React.FC<{ title: string; value: string | number; description: string; color?: string }> = ({ title, value, description, color }) => (
  <div className={`p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 ${color ? `border-l-4 ${color}` : ''}`}>
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
  </div>
);

const getOrderStatusColor = (status: Order['status']) => {
    switch (status) {
        case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'Shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
};

const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
        case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'Low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
};

const isOverdue = (dueDate: string) => new Date(dueDate) < new Date() && !isToday(dueDate);
const isToday = (dueDate: string) => new Date(dueDate).toDateString() === new Date().toDateString();


export const Dashboard: React.FC<DashboardProps> = ({ clients, products, orders, tasks, isClockedIn, lastClockLog }) => {
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const recentOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    const upcomingTasks = tasks
        .filter(t => t.status === 'To-do')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

    const [sessionTimer, setSessionTimer] = useState('00:00:00');

    useEffect(() => {
        if (isClockedIn && lastClockLog?.type === 'in') {
            const interval = setInterval(() => {
                const diff = Date.now() - new Date(lastClockLog.timestamp).getTime();
                const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                setSessionTimer(`${h}:${m}:${s}`);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isClockedIn, lastClockLog]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Shift Status" 
                    value={isClockedIn ? sessionTimer : 'Offline'} 
                    description={isClockedIn ? 'Active shift' : 'Currently clocked out'} 
                    color={isClockedIn ? 'border-green-500' : 'border-gray-300'}
                />
                <StatCard title="Total Clients" value={clients.length} description="Managed by you" />
                <StatCard title="Products in Stock" value={totalStock} description="Total units available" />
                <StatCard title="Pending Tasks" value={tasks.filter(t => t.status === 'To-do').length} description="Tasks to complete" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Order ID</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Client</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Total</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                    {recentOrders.map(order => (
                                        <tr key={order.id}>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{order.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">{clients.find(c => c.id === order.clientId)?.company || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400">{formatKes(order.total)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                     <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">My Tasks</h3>
                        {upcomingTasks.length > 0 ? (
                            <ul className="space-y-3">
                                {upcomingTasks.map(task => (
                                    <li key={task.id} className="flex items-center justify-between p-3 transition-colors bg-gray-50 rounded-lg dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate dark:text-white">{task.title}</p>
                                            <p className={`text-sm ${isOverdue(task.dueDate) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                Due: {new Date(task.dueDate).toLocaleDateString()}
                                                {isOverdue(task.dueDate) && <span className="font-bold"> (Overdue)</span>}
                                                {isToday(task.dueDate) && <span className="font-bold text-yellow-500"> (Today)</span>}
                                            </p>
                                        </div>
                                        <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-sm text-center text-gray-500 dark:text-gray-400">You have no pending tasks. Great job!</p>
                        )}
                    </div>
                </div>
                <div>
                    <ClientMap clients={clients} />
                </div>
            </div>
        </div>
    );
};
