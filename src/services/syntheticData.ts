import * as XLSX from 'xlsx';
import { InvoiceRecord, PaymentRecord } from '../types/invoice';

export const SAMPLE_VENDORS = [
  { name: 'Apex Cloud Infrastructure', id: 'VEND-001', taxId: 'US-849201948' },
  { name: 'NovaTech Global Solutions', id: 'VEND-002', taxId: 'US-192847192' },
  { name: 'Quantum Electronics Corp', id: 'VEND-003', taxId: 'GB-992817263' },
  { name: 'Horizon Digital Media', id: 'VEND-004', taxId: 'US-772819034' },
  { name: 'Global Logistics Freight', id: 'VEND-005', taxId: 'DE-827364819' },
  { name: 'CyberShield InfoSec Inc', id: 'VEND-006', taxId: 'US-334910294' },
  { name: 'Metro Office Systems Ltd', id: 'VEND-007', taxId: 'GB-102938475' },
  { name: 'Vanguard Industrial Parts', id: 'VEND-008', taxId: 'US-554433221' },
  { name: 'Solis Renewable Energy', id: 'VEND-009', taxId: 'CA-908172635' },
  { name: 'Delta Engineering Works', id: 'VEND-010', taxId: 'US-667788990' },
  { name: 'Beacon Creative Agency', id: 'VEND-011', taxId: 'US-112233445' },
  { name: 'Zenith Robotic Systems', id: 'VEND-012', taxId: 'JP-987654321' },
  { name: 'Titan Hardware Supplies', id: 'VEND-013', taxId: 'US-445566778' },
  { name: 'AeroSpace Precision Ltd', id: 'VEND-014', taxId: 'GB-556677889' },
  { name: 'Summit Medical Devices', id: 'VEND-015', taxId: 'US-778899001' },
];

export const ITEM_DESCRIPTIONS = [
  'Enterprise Server Blade Rack Units',
  'Cloud Infrastructure Compute Allocation',
  'Annual Cybersecurity Audit & Compliance License',
  'Industrial Heavy Duty Stepper Motors',
  'Optical Fiber Switch Modules 100GbE',
  'High-Speed Conveyor Sensor Array',
  'Workstation Laptop Fleet Deployment',
  'Custom Database Schema Optimization Service',
  'Automated Precision Calibration Rig',
  'Commercial Solar Inverter Replacement',
  'Executive Workspace Ergonomic Desks',
  'Robotic Assembly Arm Servicing Kit',
  'Containerized Cargo Ocean Freight Transit',
  'Digital Brand Overhaul & Asset Library',
  'Biometric Access Gateway Units',
];

export function generateSyntheticInvoices(count: number = 100): InvoiceRecord[] {
  const records: InvoiceRecord[] = [];
  const baseDate = new Date('2026-09-01');

  for (let i = 1; i <= count; i++) {
    const vendor = SAMPLE_VENDORS[(i * 3 + 7) % SAMPLE_VENDORS.length];
    const desc = ITEM_DESCRIPTIONS[i % ITEM_DESCRIPTIONS.length];
    const invoiceNum = `INV-2026-${String(i).padStart(4, '0')}`;
    const poNum = `PO-88${String(100 + i)}`;

    // Add days
    const invDateObj = new Date(baseDate);
    invDateObj.setDate(baseDate.getDate() + (i % 60));
    const invoiceDate = invDateObj.toISOString().slice(0, 10);

    const dueDateObj = new Date(invDateObj);
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDate = dueDateObj.toISOString().slice(0, 10);

    const qty = (i % 12) + 1;
    const unitPrice = Math.round((50 + (i * 37) % 850) * 100) / 100;
    const subtotal = Math.round(qty * unitPrice * 100) / 100;
    const taxRate = i % 5 === 0 ? 0.08 : i % 3 === 0 ? 0.12 : 0.10;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const discount = i % 4 === 0 ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
    const shipping = i % 2 === 0 ? 45.0 : 0;
    const currency = i % 14 === 0 ? 'EUR' : i % 18 === 0 ? 'GBP' : i % 22 === 0 ? 'CAD' : 'USD';

    // Normal math formula: Total = Subtotal + Tax + Shipping - Discount
    const correctTotal = Math.round((subtotal + taxAmount + shipping - discount) * 100) / 100;
    let actualTotal = correctTotal;
    let customInvoiceNum = invoiceNum;
    let customVendorName = vendor.name;
    let customInvoiceDate = invoiceDate;
    let customDueDate = dueDate;
    let customCurrency = currency;

    // Injected Exceptions & Edge Cases according to requirement 25:
    if (i === 12) {
      // Missing Invoice Number
      customInvoiceNum = '';
    } else if (i === 24) {
      // Missing Vendor Name
      customVendorName = '';
    } else if (i === 35) {
      // Incorrect Total Amount (Math Error)
      actualTotal = Math.round((correctTotal + 250.75) * 100) / 100;
    } else if (i === 48) {
      // Negative Amount
      actualTotal = -Math.abs(correctTotal);
    } else if (i === 57) {
      // Invalid Date format
      customInvoiceDate = '2026/99/99';
    } else if (i === 63) {
      // Due date before Invoice Date
      customDueDate = '2026-01-01';
    } else if (i === 70) {
      // Invalid unrecognized currency code
      customCurrency = 'INVALID_CURR';
    } else if (i === 75) {
      // Subtotal calculation mismatch
      actualTotal = Math.round((correctTotal - 120.00) * 100) / 100;
    } else if (i === 82) {
      // Exact duplicate of Invoice #20
      const target = records[19];
      if (target) {
        customInvoiceNum = target.invoiceNumber;
        customVendorName = target.vendorName;
        actualTotal = target.totalAmount;
      }
    } else if (i === 83) {
      // Another exact duplicate of Invoice #20
      const target = records[19];
      if (target) {
        customInvoiceNum = target.invoiceNumber;
        customVendorName = target.vendorName;
        actualTotal = target.totalAmount;
      }
    } else if (i === 91) {
      // Potential duplicate: Same vendor and amount as #40, slightly different date
      const target = records[39];
      if (target) {
        customVendorName = target.vendorName;
        actualTotal = target.totalAmount;
        customInvoiceNum = `${target.invoiceNumber}-B`;
      }
    }

    const rec: InvoiceRecord = {
      id: `rec-${i}`,
      invoiceNumber: customInvoiceNum,
      invoiceDate: customInvoiceDate,
      dueDate: customDueDate,
      vendorName: customVendorName,
      vendorId: vendor.id,
      vendorTaxId: vendor.taxId,
      purchaseOrderNumber: poNum,
      description: desc,
      quantity: qty,
      unitPrice,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      shippingCharges: shipping,
      totalAmount: actualTotal,
      expectedTotalAmount: correctTotal,
      amountDifference: Math.round((actualTotal - correctTotal) * 100) / 100,
      currency: customCurrency,
      paymentStatus: i % 3 === 0 ? 'Paid' : 'Unpaid',
      confidence: i === 65 ? 68 : 99,
      sourceFile: 'Synthetic_Enterprise_Invoices_100.xlsx',
      sheetName: 'Invoices_2026',
      rawRow: {},
      validationStatus: 'VALID',
      duplicateStatus: 'UNIQUE',
      exceptions: [],
      reviewStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    records.push(rec);
  }

  return records;
}

export function generateSyntheticPayments(invoices: InvoiceRecord[]): PaymentRecord[] {
  const payments: PaymentRecord[] = [];
  let pIdx = 1;

  invoices.forEach((inv, index) => {
    // Generate payments for ~65% of invoices
    if (index % 5 === 0) return; // Leave unmatched

    const pRef = `PMT-2026-${String(pIdx++).padStart(4, '0')}`;
    let pAmount = inv.totalAmount;

    if (index % 11 === 0) {
      // Partial payment
      pAmount = Math.round(inv.totalAmount * 0.6 * 100) / 100;
    } else if (index % 17 === 0) {
      // Overpayment
      pAmount = Math.round((inv.totalAmount + 50) * 100) / 100;
    }

    payments.push({
      id: `pmt-${pIdx}`,
      paymentReference: pRef,
      invoiceNumber: inv.invoiceNumber,
      vendorName: inv.vendorName,
      paymentDate: inv.dueDate,
      paymentAmount: pAmount,
      currency: inv.currency,
      bankReference: `WIRE-TXN-${892300 + index}`,
      notes: index % 11 === 0 ? 'First installment paid' : 'Standard clearing',
    });
  });

  return payments;
}

export function exportInvoicesToExcel(invoices: InvoiceRecord[], filename: string = 'Invoice_Intelligence_360_Export.xlsx') {
  const rows = invoices.map((inv) => ({
    'Invoice ID': inv.id,
    'Invoice Number': inv.invoiceNumber,
    'Invoice Date': inv.invoiceDate,
    'Due Date': inv.dueDate,
    'Vendor Name': inv.vendorName,
    'Vendor ID': inv.vendorId,
    'Tax ID': inv.vendorTaxId,
    'PO Number': inv.purchaseOrderNumber,
    'Description': inv.description,
    'Quantity': inv.quantity,
    'Unit Price': inv.unitPrice,
    'Subtotal': inv.subtotal,
    'Tax Rate': `${(inv.taxRate * 100).toFixed(1)}%`,
    'Tax Amount': inv.taxAmount,
    'Discount': inv.discount,
    'Shipping Charges': inv.shippingCharges,
    'Total Amount': inv.totalAmount,
    'Expected Total': inv.expectedTotalAmount,
    'Difference': inv.amountDifference,
    'Currency': inv.currency,
    'Validation Status': inv.validationStatus,
    'Duplicate Status': inv.duplicateStatus,
    'Exceptions Count': inv.exceptions.length,
    'Reconciliation Status': inv.reconciliationStatus || 'UNMATCHED',
    'Review Status': inv.reviewStatus,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Invoice_Register');

  // Add Vendor Directory Sheet
  const vendorWs = XLSX.utils.json_to_sheet(SAMPLE_VENDORS);
  XLSX.utils.book_append_sheet(wb, vendorWs, 'Vendor_Directory');

  XLSX.writeFile(wb, filename);
}

export function exportInvoicesToCsv(invoices: InvoiceRecord[], filename: string = 'Invoice_Register.csv') {
  const rows = invoices.map((inv) => ({
    'Invoice_Number': inv.invoiceNumber,
    'Invoice_Date': inv.invoiceDate,
    'Due_Date': inv.dueDate,
    'Vendor_Name': inv.vendorName,
    'PO_Number': inv.purchaseOrderNumber,
    'Subtotal': inv.subtotal,
    'Tax_Amount': inv.taxAmount,
    'Discount': inv.discount,
    'Shipping': inv.shippingCharges,
    'Total_Amount': inv.totalAmount,
    'Currency': inv.currency,
    'Status': inv.validationStatus,
    'Duplicate': inv.duplicateStatus,
    'Exceptions': inv.exceptions.map((e) => e.type).join('; '),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
