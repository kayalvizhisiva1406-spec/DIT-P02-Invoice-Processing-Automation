import { InvoiceRecord, InvoiceException, ValidationSettings } from '../types/invoice';

export const DEFAULT_SETTINGS: ValidationSettings = {
  roundingTolerance: 0.05,
  strictMathCheck: true,
  disallowNegativeAmounts: true,
  requireInvoiceNumber: true,
  requireVendorName: true,
  requireValidDate: true,
  requireDueDate: true,
  allowedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD', 'CHF', 'INR', 'SGD'],
  duplicateWindowDays: 14,
  exactDuplicateCheck: true,
  potentialDuplicateCheck: true,
};

export function validateInvoice(inv: InvoiceRecord, settings: ValidationSettings = DEFAULT_SETTINGS): {
  status: 'VALID' | 'INVALID' | 'WARNING';
  exceptions: InvoiceException[];
  expectedTotal: number;
  difference: number;
} {
  const exceptions: InvoiceException[] = [];

  // 1. Mandatory Invoice Number
  if (settings.requireInvoiceNumber && (!inv.invoiceNumber || inv.invoiceNumber.trim() === '')) {
    exceptions.push({
      id: `exc-${inv.id}-invnum`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber || 'MISSING',
      vendorName: inv.vendorName || 'UNKNOWN',
      type: 'MISSING_INVOICE_NUMBER',
      severity: 'CRITICAL',
      description: 'Invoice number is blank or missing. Every legal invoice requires a unique identifier.',
      detectedValue: '(empty)',
      expectedValue: 'Non-empty alphanumeric string (e.g. INV-2026-0001)',
      recommendedAction: 'Contact vendor for corrected invoice or locate invoice ID from original document.',
      status: 'OPEN',
    });
  }

  // 2. Mandatory Vendor Name
  if (settings.requireVendorName && (!inv.vendorName || inv.vendorName.trim() === '')) {
    exceptions.push({
      id: `exc-${inv.id}-vendor`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      vendorName: 'MISSING',
      type: 'MISSING_VENDOR_NAME',
      severity: 'CRITICAL',
      description: 'Vendor name is missing. Payee entity cannot be verified.',
      detectedValue: '(empty)',
      expectedValue: 'Registered corporate vendor name',
      recommendedAction: 'Verify vendor tax ID or purchase order header to populate vendor entity.',
      status: 'OPEN',
    });
  }

  // 3. Invoice Date validation
  if (settings.requireValidDate) {
    if (!inv.invoiceDate || isNaN(Date.parse(inv.invoiceDate)) || inv.invoiceDate.includes('99')) {
      exceptions.push({
        id: `exc-${inv.id}-date`,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        vendorName: inv.vendorName,
        type: 'INVALID_INVOICE_DATE',
        severity: 'HIGH',
        description: 'Invoice date is unparseable, malformed, or references an invalid calendar day.',
        detectedValue: String(inv.invoiceDate),
        expectedValue: 'Valid ISO date format (YYYY-MM-DD)',
        recommendedAction: 'Correct the date formatting according to standard accounting calendar.',
        status: 'OPEN',
      });
    }
  }

  // 4. Due Date validation
  if (settings.requireDueDate && inv.dueDate && inv.invoiceDate) {
    const invDateVal = Date.parse(inv.invoiceDate);
    const dueDateVal = Date.parse(inv.dueDate);
    if (isNaN(dueDateVal)) {
      exceptions.push({
        id: `exc-${inv.id}-duedate-format`,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        vendorName: inv.vendorName,
        type: 'INVALID_DUE_DATE',
        severity: 'MEDIUM',
        description: 'Due date is malformed or invalid.',
        detectedValue: String(inv.dueDate),
        expectedValue: 'Valid ISO date (YYYY-MM-DD)',
        recommendedAction: 'Enter valid due date or apply standard Net-30 payment terms.',
        status: 'OPEN',
      });
    } else if (!isNaN(invDateVal) && dueDateVal < invDateVal) {
      exceptions.push({
        id: `exc-${inv.id}-duedate-past`,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        vendorName: inv.vendorName,
        type: 'INVALID_DUE_DATE',
        severity: 'HIGH',
        description: 'Due date occurs strictly before invoice date, which violates chronological terms.',
        detectedValue: `Due: ${inv.dueDate} < Invoice: ${inv.invoiceDate}`,
        expectedValue: `Due Date >= ${inv.invoiceDate}`,
        recommendedAction: 'Adjust due date according to vendor contractual payment window.',
        status: 'OPEN',
      });
    }
  }

  // 5. Negative Amounts
  if (settings.disallowNegativeAmounts && inv.totalAmount < 0) {
    exceptions.push({
      id: `exc-${inv.id}-negative`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      vendorName: inv.vendorName,
      type: 'SUSPICIOUS_NEGATIVE_AMOUNT',
      severity: 'HIGH',
      description: 'Invoice total is negative. Standard payable invoices cannot have negative balances unless processed as Credit Note.',
      detectedValue: `${inv.currency} ${inv.totalAmount.toFixed(2)}`,
      expectedValue: 'Positive numeric total or explicit Credit Memo document',
      recommendedAction: 'Reclassify as vendor credit memo or request positive debit invoice.',
      status: 'OPEN',
    });
  }

  // 6. Currency recognition
  if (inv.currency && !settings.allowedCurrencies.includes(inv.currency.toUpperCase())) {
    exceptions.push({
      id: `exc-${inv.id}-currency`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      vendorName: inv.vendorName,
      type: 'INVALID_CURRENCY',
      severity: 'MEDIUM',
      description: `Unrecognized currency code "${inv.currency}". Must belong to authorized ISO treasury currencies.`,
      detectedValue: inv.currency,
      expectedValue: settings.allowedCurrencies.join(', '),
      recommendedAction: 'Map currency to standard ISO-4217 currency code.',
      status: 'OPEN',
    });
  }

  // 7. Mathematical Formula Verification
  // Formula: Expected Total = Subtotal + Tax + Shipping - Discount
  const subtotal = Number(inv.subtotal) || 0;
  const tax = Number(inv.taxAmount) || 0;
  const shipping = Number(inv.shippingCharges) || 0;
  const discount = Number(inv.discount) || 0;
  const expectedTotal = Math.round((subtotal + tax + shipping - discount) * 100) / 100;
  const difference = Math.round((Number(inv.totalAmount) - expectedTotal) * 100) / 100;

  if (settings.strictMathCheck && Math.abs(difference) > settings.roundingTolerance) {
    exceptions.push({
      id: `exc-${inv.id}-math`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      vendorName: inv.vendorName,
      type: 'TOTAL_AMOUNT_MISMATCH',
      severity: 'CRITICAL',
      description: `Invoice total differs from calculated formula (Subtotal + Tax + Shipping - Discount). Discrepancy of ${difference > 0 ? '+' : ''}${difference.toFixed(2)} ${inv.currency}.`,
      detectedValue: `${inv.totalAmount.toFixed(2)}`,
      expectedValue: `${expectedTotal.toFixed(2)} (Subtotal: ${subtotal} + Tax: ${tax} + Shipping: ${shipping} - Discount: ${discount})`,
      recommendedAction: 'Review itemized line items and tax calculations with supplier.',
      status: 'OPEN',
    });
  }

  // 8. OCR / Confidence Check
  if (inv.confidence && inv.confidence < 75) {
    exceptions.push({
      id: `exc-${inv.id}-ocr`,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      vendorName: inv.vendorName,
      type: 'LOW_OCR_CONFIDENCE',
      severity: 'LOW',
      description: `Document extraction confidence is ${inv.confidence}%, falling below the 75% enterprise threshold.`,
      detectedValue: `${inv.confidence}% confidence`,
      expectedValue: '>= 75% extraction confidence',
      recommendedAction: 'Visually verify extracted fields against the raw document image or PDF.',
      status: 'IN_REVIEW',
    });
  }

  // Determine overall status
  const hasCritical = exceptions.some((e) => e.severity === 'CRITICAL');
  const hasHigh = exceptions.some((e) => e.severity === 'HIGH');
  const hasMediumOrLow = exceptions.length > 0;

  let status: 'VALID' | 'INVALID' | 'WARNING' = 'VALID';
  if (hasCritical || hasHigh) {
    status = 'INVALID';
  } else if (hasMediumOrLow) {
    status = 'WARNING';
  }

  return {
    status,
    exceptions,
    expectedTotal,
    difference,
  };
}

export function validateAllInvoices(invoices: InvoiceRecord[], settings: ValidationSettings = DEFAULT_SETTINGS): InvoiceRecord[] {
  return invoices.map((inv) => {
    const result = validateInvoice(inv, settings);
    return {
      ...inv,
      validationStatus: result.status,
      expectedTotalAmount: result.expectedTotal,
      amountDifference: result.difference,
      exceptions: result.exceptions,
    };
  });
}
