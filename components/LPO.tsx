
import React from 'react';
import type { Order, Client, Product, User } from '../types';

interface LPOProps {
  order: Order;
  client: Client | undefined;
  products: Product[];
  salesRep: User | undefined;
  onClose: () => void;
}

export const LPO: React.FC<LPOProps> = ({ order, client, products, salesRep, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    if (!client?.email) return;

    const lines: string[] = [];
    lines.push(`Hello ${client.name || ''},`.trim());
    lines.push('');
    lines.push(`Please find below the LPO details for your supply.`); 
    lines.push(`LPO Number: ${order.id}`);
    lines.push(`Date: ${order.date}`);
    if (client.companyPin) lines.push(`Company PIN: ${client.companyPin}`);
    if (client.isSupplier && client.supplierCategory) lines.push(`Supplier Category: ${client.supplierCategory}`);
    lines.push('');
    lines.push('Items:');
    order.items.forEach((item) => {
      const p = products.find(pp => pp.id === item.productId);
      lines.push(`- ${p?.name || `Product ${item.productId}`}: ${item.quantity} x ${item.priceAtSale.toFixed(2)} = ${(item.quantity * item.priceAtSale).toFixed(2)}`);
    });
    lines.push('');
    lines.push(`Total: ${order.total.toFixed(2)}`);
    lines.push('');
    lines.push('Kindly confirm receipt and estimated delivery date.');
    lines.push('');
    lines.push('Regards,');
    lines.push(salesRep?.name ? `${salesRep.name} (Sales Rep)` : 'Acme Business Suite');

    const subject = encodeURIComponent(`LPO ${order.id} - ${client.company}`);
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Print Button - Hidden when printing */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 print:hidden">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Local Purchase Order (LPO)</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSendEmail}
                  disabled={!client?.email}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={client?.email ? 'Open email draft' : 'Client email is missing'}
                >
                  Send (Email)
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Print / Save as PDF
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* LPO Content */}
          <div className="p-8 print:p-6">
            {/* Header */}
            <div className="mb-8 text-center border-b-2 border-gray-300 pb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ACME BUSINESS SUITE</h1>
              <p className="text-lg text-gray-600">Local Purchase Order (LPO)</p>
            </div>

            {/* Company & Order Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">From:</h3>
                <p className="font-semibold text-gray-900">Acme Business Suite</p>
                <p className="text-gray-600">Nairobi, Kenya</p>
                <p className="text-gray-600">Email: info@acmebusiness.com</p>
                <p className="text-gray-600">Phone: +254 700 000 000</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Order Details:</h3>
                <p><span className="font-semibold">LPO Number:</span> {order.id}</p>
                <p><span className="font-semibold">Date:</span> {new Date(order.date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><span className="font-semibold">Status:</span> {order.status}</p>
                <p><span className="font-semibold">Payment:</span> {order.isPaid ? 'Paid' : 'Not Paid'}</p>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">To:</h3>
              <p className="font-semibold text-lg text-gray-900 dark:text-white">{client?.company || 'N/A'}</p>
              <p className="text-gray-600 dark:text-gray-300">Contact: {client?.name || 'N/A'}</p>
              {client?.location?.address && (
                <p className="text-gray-600 dark:text-gray-300">Address: {client.location.address}</p>
              )}
              {client?.email && (
                <p className="text-gray-600 dark:text-gray-300">Email: {client.email}</p>
              )}
              {client?.phone && (
                <p className="text-gray-600 dark:text-gray-300">Phone: {client.phone}</p>
              )}
              {client?.companyPin && (
                <p className="text-gray-600 dark:text-gray-300">Company PIN: {client.companyPin}</p>
              )}
            </div>

            {/* Sales Rep Info */}
            {salesRep && (
              <div className="mb-8 text-sm text-gray-600">
                <p><span className="font-semibold">Sales Representative:</span> {salesRep.name}</p>
              </div>
            )}

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">#</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Quantity</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Unit Price</th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    const itemTotal = item.quantity * item.priceAtSale;
                    return (
                      <tr key={item.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {product?.name || `Product ID: ${item.productId}`}
                          {product?.description && (
                            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{product.description}</span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                        <td className="border border-gray-300 px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                          ${item.priceAtSale.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          ${itemTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                    <td colSpan={4} className="border border-gray-300 px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      TOTAL AMOUNT:
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-lg text-gray-900 dark:text-white">
                      ${order.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Terms & Conditions */}
            <div className="mb-8 text-sm text-gray-600 dark:text-gray-300">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Terms & Conditions:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Payment terms as agreed between parties</li>
                <li>Delivery date to be confirmed</li>
                <li>All prices are subject to change without notice</li>
                <li>This LPO is valid for 30 days from the date of issue</li>
              </ul>
            </div>

            {/* Footer */}
            <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t-2 border-gray-300">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Authorized Signature:</p>
                <div className="h-16 border-b border-gray-300"></div>
                <p className="text-xs text-gray-500 mt-1">Sales Representative</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Client Signature:</p>
                <div className="h-16 border-b border-gray-300"></div>
                <p className="text-xs text-gray-500 mt-1">Client / Company Representative</p>
              </div>
            </div>

            {/* Print Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-center text-gray-500 print:block hidden">
              <p>Generated on {new Date().toLocaleString('en-KE')}</p>
              <p>LPO Number: {order.id} | Acme Business Suite</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white, .dark\\:bg-gray-800 {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
};
