
import React, { useRef, useState } from 'react';
import type { Order, Client, Product, User } from '../types';
import { formatKes } from '../lib/formatCurrency';

interface LPOProps {
  order: Order;
  client: Client | undefined;
  products: Product[];
  salesRep: User | undefined;
  onClose: () => void;
}

export const LPO: React.FC<LPOProps> = ({ order, client, products, salesRep, onClose }) => {
  type EditableLpoItem = {
    id: string;
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState('Acme Business Suite');
  const [companyLocation, setCompanyLocation] = useState('Nairobi, Kenya');
  const [companyEmail, setCompanyEmail] = useState('info@acmebusiness.com');
  const [companyPhone, setCompanyPhone] = useState('+254 700 000 000');
  const [lpoNumber, setLpoNumber] = useState(order.id);
  const [lpoDate, setLpoDate] = useState(order.date);
  const [lpoStatus, setLpoStatus] = useState(order.status);
  const [lpoPayment, setLpoPayment] = useState(order.isPaid ? 'Paid' : 'Not Paid');
  const [toCompany, setToCompany] = useState(client?.company || 'N/A');
  const [toContact, setToContact] = useState(client?.name || 'N/A');
  const [toAddress, setToAddress] = useState(client?.location?.address || '');
  const [toEmail, setToEmail] = useState(client?.email || '');
  const [toPhone, setToPhone] = useState(client?.phone || '');
  const [toCompanyPin, setToCompanyPin] = useState(client?.companyPin || '');
  const [salesRepName, setSalesRepName] = useState(salesRep?.name || '');
  const [termsText, setTermsText] = useState(
    [
      'Payment terms as agreed between parties',
      'Delivery date to be confirmed',
      'All prices are subject to change without notice',
      'This LPO is valid for 30 days from the date of issue',
    ].join('\n')
  );
  const [items, setItems] = useState<EditableLpoItem[]>(
    order.items.map((item, index) => {
      const product = products.find(p => p.id === item.productId);
      return {
        id: `${item.productId}-${index}`,
        productName: product?.name || `Product ID: ${item.productId}`,
        description: product?.description || '',
        quantity: item.quantity,
        unitPrice: item.priceAtSale,
      };
    })
  );
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const computedTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const updateItem = (id: string, field: keyof EditableLpoItem, value: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        if (field === 'quantity' || field === 'unitPrice') {
          const parsed = Number(value);
          return { ...item, [field]: Number.isFinite(parsed) ? parsed : 0 };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const termsList = termsText.split('\n').map(t => t.trim()).filter(Boolean);
  const printableContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printableContentRef.current) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>LPO ${lpoNumber}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
            th { background: #f3f4f6; text-align: left; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            ul { margin: 0.5rem 0 0 1rem; padding: 0; }
            li { margin: 0.25rem 0; }
            input, textarea, button { border: 0 !important; outline: 0 !important; }
          </style>
        </head>
        <body>
          ${printableContentRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleSendEmail = () => {
    if (!toEmail) return;

    const lines: string[] = [];
    lines.push(`Hello ${toContact || ''},`.trim());
    lines.push('');
    lines.push(`Please find below the LPO details for your supply.`); 
    lines.push(`LPO Number: ${lpoNumber}`);
    lines.push(`Date: ${lpoDate}`);
    if (toCompanyPin) lines.push(`Company PIN: ${toCompanyPin}`);
    lines.push('');
    lines.push('Items:');
    items.forEach((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      lines.push(`- ${item.productName}: ${item.quantity} x ${formatKes(item.unitPrice)} = ${formatKes(lineTotal)}`);
    });
    lines.push('');
    lines.push(`Total: ${formatKes(computedTotal)}`);
    lines.push('');
    termsList.forEach(term => lines.push(`- ${term}`));
    lines.push('');
    lines.push('Regards,');
    lines.push(salesRepName ? `${salesRepName} (Sales Rep)` : companyName);

    const subject = encodeURIComponent(`LPO ${lpoNumber} - ${toCompany}`);
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
  };

  const handleDownloadPdf = async () => {
    if (!printableContentRef.current || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('https://esm.sh/html2canvas@1.4.1'),
        import('https://esm.sh/jspdf@2.5.1'),
      ]);

      const canvas = await html2canvas(printableContentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 12;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const imgWidth = printableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= printableHeight;
      }

      const safeLpoNumber = lpoNumber.replace(/[^\w-]+/g, '_');
      pdf.save(`LPO-${safeLpoNumber || 'document'}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
        <div className="lpo-print-root bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Print Button - Hidden when printing */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 print:hidden">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Local Purchase Order (LPO)</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(prev => !prev)}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  {isEditing ? 'Done Editing' : 'Edit Details'}
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!toEmail}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={toEmail ? 'Open email draft' : 'Client email is missing'}
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
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
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
          <div ref={printableContentRef} className="p-8 print:p-6">
            {/* Header */}
            <div className="mb-8 text-center border-b-2 border-gray-300 pb-4">
              {isEditing ? (
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full text-center text-3xl font-bold text-gray-900 mb-2 border border-gray-300 rounded-md px-2 py-1" />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{companyName.toUpperCase()}</h1>
              )}
              <p className="text-lg text-gray-600">Local Purchase Order (LPO)</p>
            </div>

            {/* Company & Order Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">From:</h3>
                {isEditing ? (
                  <div className="space-y-1">
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                    <input value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                    <input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                    <input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900">{companyName}</p>
                    <p className="text-gray-600">{companyLocation}</p>
                    <p className="text-gray-600">Email: {companyEmail}</p>
                    <p className="text-gray-600">Phone: {companyPhone}</p>
                  </>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Order Details:</h3>
                {isEditing ? (
                  <div className="space-y-1">
                    <input value={lpoNumber} onChange={(e) => setLpoNumber(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                    <input value={lpoDate} onChange={(e) => setLpoDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                    <input value={lpoStatus} onChange={(e) => setLpoStatus(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                    <input value={lpoPayment} onChange={(e) => setLpoPayment(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                  </div>
                ) : (
                  <>
                    <p><span className="font-semibold">LPO Number:</span> {lpoNumber}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(lpoDate).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p><span className="font-semibold">Status:</span> {lpoStatus}</p>
                    <p><span className="font-semibold">Payment:</span> {lpoPayment}</p>
                  </>
                )}
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">To:</h3>
              {isEditing ? (
                <div className="space-y-1">
                  <input value={toCompany} onChange={(e) => setToCompany(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                  <input value={toContact} onChange={(e) => setToContact(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                  <input value={toAddress} onChange={(e) => setToAddress(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                  <input value={toEmail} onChange={(e) => setToEmail(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                  <input value={toPhone} onChange={(e) => setToPhone(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                  <input value={toCompanyPin} onChange={(e) => setToCompanyPin(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                </div>
              ) : (
                <>
                  <p className="font-semibold text-lg text-gray-900 dark:text-white">{toCompany}</p>
                  <p className="text-gray-600 dark:text-gray-300">Contact: {toContact}</p>
                  {toAddress && <p className="text-gray-600 dark:text-gray-300">Address: {toAddress}</p>}
                  {toEmail && <p className="text-gray-600 dark:text-gray-300">Email: {toEmail}</p>}
                  {toPhone && <p className="text-gray-600 dark:text-gray-300">Phone: {toPhone}</p>}
                  {toCompanyPin && <p className="text-gray-600 dark:text-gray-300">Company PIN: {toCompanyPin}</p>}
                </>
              )}
            </div>

            {/* Sales Rep Info */}
            <div className="mb-8 text-sm text-gray-600">
              {isEditing ? (
                <p><span className="font-semibold">Sales Representative:</span> <input value={salesRepName} onChange={(e) => setSalesRepName(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm ml-2" /></p>
              ) : (
                <p><span className="font-semibold">Sales Representative:</span> {salesRepName}</p>
              )}
            </div>

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
                  {items.map((item, index) => {
                    const itemTotal = item.quantity * item.unitPrice;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input value={item.productName} onChange={(e) => updateItem(item.id, 'productName', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                              <input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
                            </div>
                          ) : (
                            <>
                              {item.productName}
                              {item.description && <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</span>}
                            </>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                          {isEditing ? <input type="number" min="0" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center" /> : item.quantity}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                          {isEditing ? <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-right" /> : formatKes(item.unitPrice)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {formatKes(itemTotal)}
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
                      {formatKes(computedTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Terms & Conditions */}
            <div className="mb-8 text-sm text-gray-600 dark:text-gray-300">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Terms & Conditions:</h3>
              {isEditing ? (
                <textarea value={termsText} onChange={(e) => setTermsText(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm min-h-28" />
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {termsList.map((term, index) => (<li key={`${term}-${index}`}>{term}</li>))}
                </ul>
              )}
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
              <p>LPO Number: {lpoNumber} | {companyName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          html, body {
            width: 210mm;
            min-height: 297mm;
            background: white !important;
          }
          body * {
            visibility: hidden !important;
          }
          .lpo-print-root,
          .lpo-print-root * {
            visibility: visible !important;
          }
          .lpo-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            max-height: none;
            overflow: visible;
            box-shadow: none;
            border-radius: 0;
            background: white !important;
            color-adjust: exact;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .lpo-print-root table {
            page-break-inside: auto;
          }
          .lpo-print-root tr,
          .lpo-print-root td,
          .lpo-print-root th {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .lpo-print-root thead {
            display: table-header-group;
          }
          .lpo-print-root tfoot {
            display: table-footer-group;
          }
          .lpo-print-root ul,
          .lpo-print-root .grid,
          .lpo-print-root .mb-8 {
            break-inside: avoid;
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
