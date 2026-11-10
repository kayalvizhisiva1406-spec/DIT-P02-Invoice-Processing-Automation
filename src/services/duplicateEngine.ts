import { InvoiceRecord, InvoiceException, ValidationSettings } from '../types/invoice';

export interface DuplicateGroup {
  groupId: string;
  type: 'EXACT' | 'POTENTIAL';
  reason: string;
  invoiceIds: string[];
  records: InvoiceRecord[];
}

export function detectDuplicates(
  invoices: InvoiceRecord[],
  settings: ValidationSettings
): {
  processedInvoices: InvoiceRecord[];
  duplicateGroups: DuplicateGroup[];
  exactCount: number;
  potentialCount: number;
} {
  const groups: Record<string, { type: 'EXACT' | 'POTENTIAL'; reason: string; items: InvoiceRecord[] }> = {};
  const processed = invoices.map((inv) => ({ ...inv }));

  // Helper map for fast lookup
  const exactKeyMap: Record<string, InvoiceRecord[]> = {};

  // 1. Exact Duplicate Check (Invoice Number + Vendor + Amount)
  if (settings.exactDuplicateCheck) {
    processed.forEach((inv) => {
      if (!inv.invoiceNumber || !inv.vendorName) return; // Handled by missing field validation

      // Normalize key
      const normNumber = inv.invoiceNumber.trim().toUpperCase();
      const normVendor = inv.vendorName.trim().toUpperCase();
      const normAmount = Math.abs(inv.totalAmount).toFixed(2);
      const exactKey = `${normNumber}::${normVendor}::${normAmount}`;

      if (!exactKeyMap[exactKey]) {
        exactKeyMap[exactKey] = [];
      }
      exactKeyMap[exactKey].push(inv);
    });

    Object.entries(exactKeyMap).forEach(([key, items]) => {
      if (items.length > 1) {
        const groupId = `DUP-EXACT-${Math.abs(key.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))}`;
        const reason = `Exact match across Invoice Number (${items[0].invoiceNumber}), Vendor (${items[0].vendorName}), and Total Amount (${items[0].totalAmount}).`;

        groups[groupId] = {
          type: 'EXACT',
          reason,
          items,
        };

        // Mark all except the first one as EXACT_DUPLICATE, and the first as origin
        items.forEach((item, idx) => {
          if (idx > 0) {
            item.duplicateStatus = 'EXACT_DUPLICATE';
            item.duplicateOfId = items[0].id;
            item.duplicateReason = reason;
            item.duplicateGroup = groupId;

            // Add exception if not already present
            const exists = item.exceptions.some((e) => e.type === 'DUPLICATE_INVOICE');
            if (!exists) {
              const exc: InvoiceException = {
                id: `exc-dup-${item.id}`,
                invoiceId: item.id,
                invoiceNumber: item.invoiceNumber,
                vendorName: item.vendorName,
                type: 'DUPLICATE_INVOICE',
                severity: 'CRITICAL',
                description: `Identical record duplicate of ${items[0].invoiceNumber} (ID: ${items[0].id}). Multiple payment risk.`,
                detectedValue: `${item.invoiceNumber} | ${item.vendorName} | ${item.totalAmount}`,
                expectedValue: 'Unique invoice per vendor billing event',
                recommendedAction: 'Verify billing ledger to void duplicate submission or link as credit adjustment.',
                status: 'OPEN',
              };
              item.exceptions.push(exc);
              if (item.validationStatus === 'VALID') item.validationStatus = 'INVALID';
            }
          } else {
            item.duplicateGroup = groupId;
          }
        });
      }
    });
  }

  // 2. Potential Duplicate Check (Same Vendor + Amount within duplicateWindowDays, or Same Number different vendor)
  if (settings.potentialDuplicateCheck) {
    for (let i = 0; i < processed.length; i++) {
      for (let j = i + 1; j < processed.length; j++) {
        const a = processed[i];
        const b = processed[j];

        // Skip if already marked exact
        if (a.duplicateStatus === 'EXACT_DUPLICATE' || b.duplicateStatus === 'EXACT_DUPLICATE') continue;
        if (!a.invoiceNumber || !b.invoiceNumber || !a.vendorName || !b.vendorName) continue;

        let potentialReason = '';

        // Case A: Same vendor, exact same amount, dates within window days
        if (
          a.vendorName.trim().toLowerCase() === b.vendorName.trim().toLowerCase() &&
          Math.abs(a.totalAmount - b.totalAmount) < 0.01 &&
          a.invoiceNumber !== b.invoiceNumber
        ) {
          const d1 = new Date(a.invoiceDate).getTime();
          const d2 = new Date(b.invoiceDate).getTime();
          const diffDays = Math.abs(d1 - d2) / (1000 * 3600 * 24);

          if (!isNaN(diffDays) && diffDays <= settings.duplicateWindowDays) {
            potentialReason = `Same vendor (${a.vendorName}) and identical amount (${a.totalAmount} ${a.currency}) within ${Math.round(diffDays)} days (${a.invoiceNumber} vs ${b.invoiceNumber}).`;
          }
        }

        // Case B: Same invoice number with different vendor
        if (
          a.invoiceNumber.trim().toUpperCase() === b.invoiceNumber.trim().toUpperCase() &&
          a.vendorName.trim().toLowerCase() !== b.vendorName.trim().toLowerCase()
        ) {
          potentialReason = `Invoice Number ${a.invoiceNumber} appears under different vendors (${a.vendorName} vs ${b.vendorName}). Possible cross-vendor clerical error.`;
        }

        if (potentialReason) {
          const pGroupId = `DUP-POTENTIAL-${a.id}-${b.id}`;
          groups[pGroupId] = {
            type: 'POTENTIAL',
            reason: potentialReason,
            items: [a, b],
          };

          if (b.duplicateStatus === 'UNIQUE') {
            b.duplicateStatus = 'POTENTIAL_DUPLICATE';
            b.duplicateOfId = a.id;
            b.duplicateReason = potentialReason;
            b.duplicateGroup = pGroupId;

            const exists = b.exceptions.some((e) => e.type === 'DUPLICATE_INVOICE');
            if (!exists) {
              b.exceptions.push({
                id: `exc-pdup-${b.id}`,
                invoiceId: b.id,
                invoiceNumber: b.invoiceNumber,
                vendorName: b.vendorName,
                type: 'DUPLICATE_INVOICE',
                severity: 'HIGH',
                description: `Potential duplicate: ${potentialReason}`,
                detectedValue: `${b.invoiceNumber} (${b.vendorName})`,
                expectedValue: 'Confirmed independent purchase order',
                recommendedAction: 'Inspect purchase order line items to confirm separate procurement.',
                status: 'OPEN',
              });
              if (b.validationStatus === 'VALID') b.validationStatus = 'WARNING';
            }
          }
          if (a.duplicateStatus === 'UNIQUE') {
            a.duplicateGroup = pGroupId;
          }
        }
      }
    }
  }

  const duplicateGroupsList: DuplicateGroup[] = Object.entries(groups).map(([groupId, g]) => ({
    groupId,
    type: g.type,
    reason: g.reason,
    invoiceIds: g.items.map((i) => i.id),
    records: g.items,
  }));

  const exactCount = processed.filter((i) => i.duplicateStatus === 'EXACT_DUPLICATE').length;
  const potentialCount = processed.filter((i) => i.duplicateStatus === 'POTENTIAL_DUPLICATE').length;

  return {
    processedInvoices: processed,
    duplicateGroups: duplicateGroupsList,
    exactCount,
    potentialCount,
  };
}
