import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { InvoiceRecord, InvoiceException, PaymentRecord } from '../types/invoice';
import { ReconciliationSummary } from './reconciliationEngine';

export class ReportExporter {
  // 1. Export Invoice Register to PDF
  public static exportInvoiceRegisterPdf(invoices: InvoiceRecord[], title: string = 'Invoice Register Report') {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

    // Branded Header
    doc.setFillColor(15, 23, 42); // dark navy
    doc.rect(0, 0, 792, 60, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE INTELLIGENCE 360', 30, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`${title} | Generated: ${new Date().toLocaleString()}`, 30, 48);

    // Summary KPI box
    const totalCount = invoices.length;
    const validCount = invoices.filter((i) => i.validationStatus === 'VALID').length;
    const invalidCount = invoices.filter((i) => i.validationStatus === 'INVALID').length;
    const totalAmount = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(
      `Total Invoices: ${totalCount}  |  Valid: ${validCount}  |  Invalid / Flagged: ${invalidCount}  |  Gross Amount: $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      30,
      80
    );

    const tableRows = invoices.map((inv) => [
      inv.invoiceNumber || 'N/A',
      inv.vendorName || 'N/A',
      inv.invoiceDate || 'N/A',
      inv.dueDate || 'N/A',
      `${inv.currency} ${inv.totalAmount.toFixed(2)}`,
      inv.validationStatus,
      inv.duplicateStatus,
      inv.exceptions.length > 0 ? `${inv.exceptions.length} exc` : 'None',
      inv.reviewStatus,
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Inv #', 'Vendor', 'Date', 'Due Date', 'Amount', 'Status', 'Duplicate', 'Exceptions', 'Review']],
      body: tableRows,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  }

  // 2. Export Exception Report to PDF
  public static exportExceptionReportPdf(exceptions: InvoiceException[], title: string = 'Exception Audit Report') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

    // Header
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, 612, 60, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE INTELLIGENCE 360', 30, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(196, 181, 253);
    doc.text(`${title} | ${new Date().toLocaleString()}`, 30, 48);

    doc.setTextColor(71, 85, 105);
    doc.text(`Total Exceptions Identified: ${exceptions.length}`, 30, 80);

    const rows = exceptions.map((e) => [
      e.invoiceNumber,
      e.vendorName,
      e.type.replace(/_/g, ' '),
      e.severity,
      e.detectedValue,
      e.expectedValue,
      e.status,
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Invoice #', 'Vendor', 'Exception Type', 'Severity', 'Detected', 'Expected', 'Status']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [254, 242, 242] },
    });

    doc.save(`Exception_Report_${Date.now()}.pdf`);
  }

  // 3. Export Reconciliation Summary to PDF
  public static exportReconciliationPdf(
    invoices: InvoiceRecord[],
    summary: ReconciliationSummary,
    payments: PaymentRecord[]
  ) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 612, 60, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE INTELLIGENCE 360 - RECONCILIATION SUMMARY', 30, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Reconciliation Match Rate: ${summary.reconciliationRate}% | Generated: ${new Date().toLocaleString()}`, 30, 48);

    // KPI Summary
    const kpiData = [
      ['Total Invoices', `${summary.totalInvoices} ($${summary.totalInvoiceAmount.toFixed(2)})`],
      ['Total Payments Ingested', `${summary.totalPayments} ($${summary.totalPaymentAmount.toFixed(2)})`],
      ['Fully Matched Records', `${summary.fullyMatchedCount} ($${summary.fullyMatchedAmount.toFixed(2)})`],
      ['Partially Matched Records', `${summary.partiallyMatchedCount} ($${summary.partiallyMatchedAmount.toFixed(2)})`],
      ['Unmatched Invoices', `${summary.unmatchedCount} ($${summary.unmatchedAmount.toFixed(2)})`],
      ['Overpayment Variance', `${summary.overpaymentCount} ($${summary.overpaymentVariance.toFixed(2)})`],
      ['Underpayment Variance', `${summary.underpaymentCount} ($${summary.underpaymentVariance.toFixed(2)})`],
    ];

    autoTable(doc, {
      startY: 80,
      head: [['Reconciliation Metric', 'Value']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 9 },
    });

    // Detailed matches table
    const sampleRows = invoices.slice(0, 35).map((inv) => [
      inv.invoiceNumber,
      inv.vendorName,
      inv.totalAmount.toFixed(2),
      inv.matchedPayment ? inv.matchedPayment.paymentReference : 'None',
      inv.reconciledAmount ? inv.reconciledAmount.toFixed(2) : '0.00',
      inv.outstandingBalance ? inv.outstandingBalance.toFixed(2) : '0.00',
      inv.reconciliationStatus || 'UNMATCHED',
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 25,
      head: [['Inv #', 'Vendor', 'Inv Total', 'Payment Ref', 'Paid', 'Outstanding', 'Status']],
      body: sampleRows,
      styles: { fontSize: 7, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save(`Reconciliation_Summary_${Date.now()}.pdf`);
  }

  // 4. Export to Excel Multi-Sheet Workbook
  public static exportComprehensiveExcel(
    invoices: InvoiceRecord[],
    exceptions: InvoiceException[],
    summary?: ReconciliationSummary
  ) {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Invoices
    const invRows = invoices.map((i) => ({
      'Invoice #': i.invoiceNumber,
      'Vendor': i.vendorName,
      'Date': i.invoiceDate,
      'Due Date': i.dueDate,
      'Subtotal': i.subtotal,
      'Tax Amount': i.taxAmount,
      'Total Amount': i.totalAmount,
      'Expected Total': i.expectedTotalAmount,
      'Variance': i.amountDifference,
      'Currency': i.currency,
      'Validation Status': i.validationStatus,
      'Duplicate Status': i.duplicateStatus,
      'Reconciliation Status': i.reconciliationStatus || 'N/A',
      'Review Status': i.reviewStatus,
    }));
    const invWs = XLSX.utils.json_to_sheet(invRows);
    XLSX.utils.book_append_sheet(wb, invWs, 'Invoice_Register');

    // Sheet 2: Exceptions
    const excRows = exceptions.map((e) => ({
      'Invoice #': e.invoiceNumber,
      'Vendor': e.vendorName,
      'Exception Type': e.type,
      'Severity': e.severity,
      'Detected Value': e.detectedValue,
      'Expected Value': e.expectedValue,
      'Recommended Action': e.recommendedAction,
      'Status': e.status,
    }));
    const excWs = XLSX.utils.json_to_sheet(excRows);
    XLSX.utils.book_append_sheet(wb, excWs, 'Exception_Report');

    // Sheet 3: Reconciliation Summary (if available)
    if (summary) {
      const recRows = [
        { Metric: 'Total Invoices', Value: summary.totalInvoices },
        { Metric: 'Total Invoice Amount', Value: summary.totalInvoiceAmount },
        { Metric: 'Total Payments Received', Value: summary.totalPaymentAmount },
        { Metric: 'Fully Matched Count', Value: summary.fullyMatchedCount },
        { Metric: 'Fully Matched Amount', Value: summary.fullyMatchedAmount },
        { Metric: 'Unmatched Invoices Count', Value: summary.unmatchedCount },
        { Metric: 'Match Rate (%)', Value: summary.reconciliationRate },
      ];
      const recWs = XLSX.utils.json_to_sheet(recRows);
      XLSX.utils.book_append_sheet(wb, recWs, 'Reconciliation_Metrics');
    }

    XLSX.writeFile(wb, `Invoice_Intelligence_360_Master_Report_${Date.now()}.xlsx`);
  }
}
