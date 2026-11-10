export type ValidationStatus = 'VALID' | 'INVALID' | 'WARNING';
export type DuplicateStatus = 'UNIQUE' | 'EXACT_DUPLICATE' | 'POTENTIAL_DUPLICATE';
export type ReconciliationStatus = 'MATCHED' | 'PARTIALLY_MATCHED' | 'UNMATCHED' | 'OVERPAYMENT' | 'UNDERPAYMENT';
export type ExceptionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'RESOLVED' | 'REJECTED';

export type ExceptionType =
  | 'MISSING_INVOICE_NUMBER'
  | 'MISSING_VENDOR_NAME'
  | 'INVALID_INVOICE_DATE'
  | 'INVALID_DUE_DATE'
  | 'INCORRECT_TAX_CALCULATION'
  | 'TOTAL_AMOUNT_MISMATCH'
  | 'DUPLICATE_INVOICE'
  | 'INVALID_CURRENCY'
  | 'MISSING_MANDATORY_FIELDS'
  | 'SUSPICIOUS_NEGATIVE_AMOUNT'
  | 'INCOMPLETE_DATA'
  | 'LOW_OCR_CONFIDENCE';

export interface InvoiceException {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  vendorName: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  description: string;
  detectedValue: string;
  expectedValue: string;
  recommendedAction: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface PaymentRecord {
  id: string;
  paymentReference: string;
  invoiceNumber: string;
  vendorName: string;
  paymentDate: string;
  paymentAmount: number;
  currency: string;
  bankReference: string;
  notes?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  vendorName: string;
  vendorId: string;
  vendorTaxId: string;
  purchaseOrderNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number; // e.g., 0.10 for 10%
  taxAmount: number;
  discount: number;
  shippingCharges: number;
  totalAmount: number;
  expectedTotalAmount: number;
  amountDifference: number;
  currency: string;
  paymentStatus: string; // e.g. "Unpaid", "Paid", "Pending"
  confidence: number; // 0 to 100%
  sourceFile: string;
  sheetName?: string;
  rawRow: Record<string, any>;

  // Evaluated status
  validationStatus: ValidationStatus;
  duplicateStatus: DuplicateStatus;
  duplicateOfId?: string;
  duplicateReason?: string;
  duplicateGroup?: string;

  exceptions: InvoiceException[];

  // Reconciliation status
  reconciliationStatus?: ReconciliationStatus;
  matchedPayment?: PaymentRecord;
  reconciledAmount?: number;
  outstandingBalance?: number;

  // Review & Audit
  reviewStatus: ReviewStatus;
  reviewNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface ValidationSettings {
  roundingTolerance: number; // default 0.05
  strictMathCheck: boolean;
  disallowNegativeAmounts: boolean;
  requireInvoiceNumber: boolean;
  requireVendorName: boolean;
  requireValidDate: boolean;
  requireDueDate: boolean;
  allowedCurrencies: string[];
  duplicateWindowDays: number;
  exactDuplicateCheck: boolean;
  potentialDuplicateCheck: boolean;
}

export interface ColumnMappingConfig {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  vendorName: string;
  vendorId: string;
  vendorTaxId: string;
  purchaseOrderNumber: string;
  description: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  discount: string;
  shippingCharges: string;
  totalAmount: string;
  currency: string;
  paymentStatus: string;
}

export interface AgileTask {
  id: string;
  taskName: string;
  assignedMember: string;
  role: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'BACKLOG' | 'TO DO' | 'IN PROGRESS' | 'TESTING' | 'DONE';
  dueDate: string;
  acceptanceCriteria: string;
  userStory: string;
  completedAt?: string;
}

export interface TestCaseItem {
  id: string;
  category: string;
  scenario: string;
  inputDescription: string;
  expectedResult: string;
  actualResult: string;
  status: 'PENDING' | 'PASS' | 'FAIL';
  executionDurationMs: number;
  remarks: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'DEBUG';
  module: string;
  action: string;
  message: string;
  status: string;
  raw: string;
}

export interface ProcessingHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  startTime: string;
  completionTime: string;
  durationMs: number;
  recordCount: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  exceptionCount: number;
  totalAmount: number;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
}
