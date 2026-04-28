import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { Product } from '../types';

interface StockChartProps {
    products: Product[];
    lowStockThreshold: number;
}

export const StockChart: React.FC<StockChartProps> = ({ products, lowStockThreshold }) => {
    const data = products.map(p => ({
        name: p.name,
        stock: p.stock,
        category: p.category
    }));

    return (
        <div className="h-96 w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 mb-6 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Stock Levels</h3>
            <div className="w-full h-80 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" opacity={0.3} vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#9CA3AF' }} 
                            tickLine={false}
                            axisLine={{ stroke: '#4B5563', opacity: 0.5 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis 
                            tick={{ fill: '#9CA3AF' }} 
                            tickLine={false}
                            axisLine={{ stroke: '#4B5563', opacity: 0.5 }}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '0.375rem' }}
                            itemStyle={{ color: '#F3F4F6' }}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="stock" name="Stock Units" fill="#EAB308" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.stock <= lowStockThreshold ? '#EF4444' : '#EAB308'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};