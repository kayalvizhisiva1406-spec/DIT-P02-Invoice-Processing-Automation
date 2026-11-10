import { InvoiceRecord, PaymentRecord, ReconciliationStatus } from '../types/invoice';

export interface ReconciliationSummary {
  totalInvoices: number;
  totalInvoiceAmount: number;
  totalPayments: number;
  totalPaymentAmount: number;
  fullyMatchedCount: number;
  fullyMatchedAmount: number;
  partiallyMatchedCount: number;
  partiallyMatchedAmount: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  overpaymentCount: number;
  overpaymentVariance: number;
  underpaymentCount: number;
  underpaymentVariance: number;
  reconciliationRate: number; // percentage
  hasPaymentLedger: boolean;
}

export function reconcileInvoicesWithPayments(
  invoices: InvoiceRecord[],
  payments: PaymentRecord[],
  tolerance: number = 0.05
): {
  reconciledInvoices: InvoiceRecord[];
  summary: ReconciliationSummary;
  unmatchedPayments: PaymentRecord[];
} {
  const hasPaymentLedger = payments && payments.length > 0;

  if (!hasPaymentLedger) {
    // Generate invoice-only baseline reconciliation
    const totalAmount = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const updated = invoices.map((inv) => ({
      ...inv,
      reconciliationStatus: 'UNMATCHED' as ReconciliationStatus,
      reconciledAmount: 0,
      outstandingBalance: inv.totalAmount,
    }));

    return {
      reconciledInvoices: updated,
      summary: {
        totalInvoices: invoices.length,
        totalInvoiceAmount: totalAmount,
        totalPayments: 0,
        totalPaymentAmount: 0,
        fullyMatchedCount: 0,
        fullyMatchedAmount: 0,
        partiallyMatchedCount: 0,
        partiallyMatchedAmount: 0,
        unmatchedCount: invoices.length,
        unmatchedAmount: totalAmount,
        overpaymentCount: 0,
        overpaymentVariance: 0,
        underpaymentCount: 0,
        underpaymentVariance: 0,
        reconciliationRate: 0,
        hasPaymentLedger: false,
      },
      unmatchedPayments: [],
    };
  }

  // Create lookup map of payments by normalized Invoice Number
  const paymentMap: Record<string, PaymentRecord[]> = {};
  payments.forEach((p) => {
    if (!p.invoiceNumber) return;
    const key = p.invoiceNumber.trim().toUpperCase();
    if (!paymentMap[key]) paymentMap[key] = [];
    paymentMap[key].push(p);
  });

  const matchedPaymentIds = new Set<string>();

  let fullyMatchedCount = 0;
  let fullyMatchedAmount = 0;
  let partiallyMatchedCount = 0;
  let partiallyMatchedAmount = 0;
  let unmatchedCount = 0;
  let unmatchedAmount = 0;
  let overpaymentCount = 0;
  let overpaymentVariance = 0;
  let underpaymentCount = 0;
  let underpaymentVariance = 0;

  const reconciledInvoices: InvoiceRecord[] = invoices.map((inv) => {
    const key = (inv.invoiceNumber || '').trim().toUpperCase();
    const candidatePayments = paymentMap[key] || [];

    // Find best payment match
    let matchedPmt: PaymentRecord | undefined = undefined;
    if (candidatePayments.length > 0) {
      // Pick first unused or best matching amount
      matchedPmt = candidatePayments.find((p) => !matchedPaymentIds.has(p.id)) || candidatePayments[0];
    }

    if (!matchedPmt) {
      unmatchedCount++;
      unmatchedAmount += inv.totalAmount;
      return {
        ...inv,
        reconciliationStatus: 'UNMATCHED',
        reconciledAmount: 0,
        outstandingBalance: inv.totalAmount,
      };
    }

    matchedPaymentIds.add(matchedPmt.id);
    const pmtAmt = matchedPmt.paymentAmount;
    const diff = Math.round((pmtAmt - inv.totalAmount) * 100) / 100;

    let recStatus: ReconciliationStatus = 'MATCHED';
    let outstanding = 0;

    if (Math.abs(diff) <= tolerance) {
      recStatus = 'MATCHED';
      fullyMatchedCount++;
      fullyMatchedAmount += inv.totalAmount;
      outstanding = 0;
    } else if (diff > tolerance) {
      recStatus = 'OVERPAYMENT';
      overpaymentCount++;
      overpaymentVariance += diff;
      fullyMatchedAmount += inv.totalAmount;
      outstanding = 0;
    } else {
      // Payment is less than invoice total
      if (pmtAmt > 0) {
        recStatus = 'PARTIALLY_MATCHED';
        partiallyMatchedCount++;
        partiallyMatchedAmount += pmtAmt;
        underpaymentCount++;
        underpaymentVariance += Math.abs(diff);
        outstanding = Math.round((inv.totalAmount - pmtAmt) * 100) / 100;
      } else {
        recStatus = 'UNMATCHED';
        unmatchedCount++;
        unmatchedAmount += inv.totalAmount;
        outstanding = inv.totalAmount;
      }
    }

    return {
      ...inv,
      reconciliationStatus: recStatus,
      matchedPayment: matchedPmt,
      reconciledAmount: pmtAmt,
      outstandingBalance: outstanding,
    };
  });

  const unmatchedPayments = payments.filter((p) => !matchedPaymentIds.has(p.id));
  const totalInvAmt = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const totalPmtAmt = payments.reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);

  const totalEligible = invoices.length;
  const reconciliationRate = totalEligible > 0 ? Math.round(((fullyMatchedCount + overpaymentCount) / totalEligible) * 1000) / 10 : 0;

  return {
    reconciledInvoices,
    summary: {
      totalInvoices: invoices.length,
      totalInvoiceAmount: Math.round(totalInvAmt * 100) / 100,
      totalPayments: payments.length,
      totalPaymentAmount: Math.round(totalPmtAmt * 100) / 100,
      fullyMatchedCount,
      fullyMatchedAmount: Math.round(fullyMatchedAmount * 100) / 100,
      partiallyMatchedCount,
      partiallyMatchedAmount: Math.round(partiallyMatchedAmount * 100) / 100,
      unmatchedCount,
      unmatchedAmount: Math.round(unmatchedAmount * 100) / 100,
      overpaymentCount,
      overpaymentVariance: Math.round(overpaymentVariance * 100) / 100,
      underpaymentCount,
      underpaymentVariance: Math.round(underpaymentVariance * 100) / 100,
      reconciliationRate,
      hasPaymentLedger: true,
    },
    unmatchedPayments,
  };
}
