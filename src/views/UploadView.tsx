import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  Settings2,
} from 'lucide-react';
import { InvoiceRecord, ColumnMappingConfig } from '../types/invoice';
import { logger } from '../services/logger';

interface UploadViewProps {
  onProcessRecords: (records: InvoiceRecord[], fileName: string) => void;
  onLoadSynthetic: () => void;
  onDownloadSample: () => void;
}

const DEFAULT_MAPPING: ColumnMappingConfig = {
  invoiceNumber: '',
  invoiceDate: '',
  dueDate: '',
  vendorName: '',
  vendorId: '',
  vendorTaxId: '',
  purchaseOrderNumber: '',
  description: '',
  quantity: '',
  unitPrice: '',
  subtotal: '',
  taxRate: '',
  taxAmount: '',
  discount: '',
  shippingCharges: '',
  totalAmount: '',
  currency: '',
  paymentStatus: '',
};

export const UploadView: React.FC<UploadViewProps> = ({
  onProcessRecords,
  onLoadSynthetic,
  onDownloadSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig>(DEFAULT_MAPPING);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [step, setStep] = useState<'SELECT' | 'MAP' | 'PREVIEW'>('SELECT');

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  // Heuristic auto-mapping
  const autoMapColumns = (cols: string[]): ColumnMappingConfig => {
    const mapping: ColumnMappingConfig = { ...DEFAULT_MAPPING };
    const lowerCols = cols.map((c) => ({ original: c, lower: c.toLowerCase().replace(/[^a-z0-9]/g, '') }));

    const findMatch = (candidates: string[]) => {
      for (const cand of candidates) {
        const found = lowerCols.find((c) => c.lower.includes(cand));
        if (found) return found.original;
      }
      return '';
    };

    mapping.invoiceNumber = findMatch(['invoicenumber', 'invoiceno', 'invno', 'inv#', 'billno', 'invid', 'invoiceid']) || cols[0] || '';
    mapping.invoiceDate = findMatch(['invoicedate', 'invdate', 'date', 'billdate']) || '';
    mapping.dueDate = findMatch(['duedate', 'paymentdue', 'due']) || '';
    mapping.vendorName = findMatch(['vendorname', 'vendor', 'suppliername', 'supplier', 'payee', 'company']) || '';
    mapping.vendorId = findMatch(['vendorid', 'supplierid']) || '';
    mapping.vendorTaxId = findMatch(['vendortaxid', 'taxid', 'vatno', 'gstno', 'ein']) || '';
    mapping.purchaseOrderNumber = findMatch(['purchaseordernumber', 'purchaseorder', 'ponumber', 'po#', 'orderid']) || '';
    mapping.description = findMatch(['description', 'itemdescription', 'item', 'details', 'memo']) || '';
    mapping.quantity = findMatch(['quantity', 'qty', 'units', 'count']) || '';
    mapping.unitPrice = findMatch(['unitprice', 'price', 'rate', 'cost']) || '';
    mapping.subtotal = findMatch(['subtotal', 'lineamount', 'netamount']) || '';
    mapping.taxRate = findMatch(['taxrate', 'vatrate', 'taxpercent']) || '';
    mapping.taxAmount = findMatch(['taxamount', 'tax', 'vat', 'gst']) || '';
    mapping.discount = findMatch(['discount', 'rebate', 'deduction']) || '';
    mapping.shippingCharges = findMatch(['shippingcharges', 'shipping', 'freight', 'delivery']) || '';
    mapping.totalAmount = findMatch(['totalamount', 'total', 'grossamount', 'invoiceamount', 'amount', 'balance']) || '';
    mapping.currency = findMatch(['currency', 'curr', 'iso']) || '';
    mapping.paymentStatus = findMatch(['paymentstatus', 'status', 'paidstatus']) || '';

    return mapping;
  };

  // Parse Excel or CSV
  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage('');
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setErrorMessage(`Unsupported format .${ext}. Please upload .xlsx, .xls, or .csv`);
      logger.log('ERROR', 'UPLOAD', 'File Upload Failed', `Unsupported file extension .${ext}`, 'FAILED');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      setSheetNames(workbook.SheetNames);
      const firstSheet = workbook.SheetNames[0];
      setSelectedSheet(firstSheet);

      const worksheet = workbook.Sheets[firstSheet];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        setErrorMessage('The selected worksheet contains no data rows.');
        return;
      }

      setRawRows(jsonData);
      const cols = Object.keys(jsonData[0] || {});
      setAvailableColumns(cols);
      setColumnMapping(autoMapColumns(cols));
      setStep('MAP');

      logger.log(
        'INFO',
        'UPLOAD',
        `${file.name} Uploaded`,
        `Identified ${workbook.SheetNames.length} sheet(s) and ${jsonData.length} row(s)`,
        'SUCCESS'
      );
    } catch (err: any) {
      setErrorMessage(`Failed to read file: ${err.message}`);
      logger.log('ERROR', 'UPLOAD', 'File Parsing Error', err.message, 'FAILED');
    }
  };

  // Sheet switch
  const handleSheetChange = (sheetName: string) => {
    if (!selectedFile) return;
    setSelectedSheet(sheetName);
    selectedFile.arrayBuffer().then((buffer) => {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      setRawRows(jsonData);
      if (jsonData.length > 0) {
        const cols = Object.keys(jsonData[0]);
        setAvailableColumns(cols);
        setColumnMapping(autoMapColumns(cols));
      }
    });
  };

  // Convert raw rows using mapping into InvoiceRecord[]
  const handleConfirmAndProcess = () => {
    setIsProcessing(true);
    logger.log('INFO', 'PROCESSING', 'Invoice Processing Started', `Transforming ${rawRows.length} raw records`, 'SUCCESS');

    try {
      const parsedRecords: InvoiceRecord[] = rawRows.map((row, idx) => {
        const val = (k: keyof ColumnMappingConfig) => {
          const colName = columnMapping[k];
          return colName && row[colName] !== undefined ? String(row[colName]).trim() : '';
        };

        const numVal = (k: keyof ColumnMappingConfig, fallback = 0) => {
          const str = val(k).replace(/[^0-9.-]/g, '');
          const n = parseFloat(str);
          return isNaN(n) ? fallback : n;
        };

        const subtotal = numVal('subtotal', numVal('unitPrice', 0) * (numVal('quantity', 1) || 1));
        const taxRate = numVal('taxRate', 0.1);
        const taxAmount = numVal('taxAmount', subtotal * taxRate);
        const discount = numVal('discount', 0);
        const shipping = numVal('shippingCharges', 0);
        const expectedTotal = Math.round((subtotal + taxAmount + shipping - discount) * 100) / 100;

        const rawTotal = numVal('totalAmount', expectedTotal);

        return {
          id: `file-rec-${idx + 1}`,
          invoiceNumber: val('invoiceNumber'),
          invoiceDate: val('invoiceDate'),
          dueDate: val('dueDate'),
          vendorName: val('vendorName'),
          vendorId: val('vendorId') || `VEND-${100 + (idx % 15)}`,
          vendorTaxId: val('vendorTaxId') || 'US-TAX-AUTO',
          purchaseOrderNumber: val('purchaseOrderNumber') || `PO-AUTO-${1000 + idx}`,
          description: val('description') || 'General Business Services & Supplies',
          quantity: numVal('quantity', 1),
          unitPrice: numVal('unitPrice', subtotal),
          subtotal,
          taxRate,
          taxAmount,
          discount,
          shippingCharges: shipping,
          totalAmount: rawTotal,
          expectedTotalAmount: expectedTotal,
          amountDifference: Math.round((rawTotal - expectedTotal) * 100) / 100,
          currency: (val('currency') || 'USD').toUpperCase(),
          paymentStatus: val('paymentStatus') || 'Unpaid',
          confidence: 98,
          sourceFile: selectedFile?.name || 'Manual_Upload.xlsx',
          sheetName: selectedSheet,
          rawRow: row,
          validationStatus: 'VALID',
          duplicateStatus: 'UNIQUE',
          exceptions: [],
          reviewStatus: 'PENDING',
          createdAt: new Date().toISOString(),
        };
      });

      onProcessRecords(parsedRecords, selectedFile?.name || 'Uploaded_Dataset');
      setIsProcessing(false);
    } catch (err: any) {
      setErrorMessage(`Processing error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            Smart File Upload & Document Extraction Engine
          </h2>
          <p className="text-xs text-slate-300">
            Support for enterprise Excel (.xlsx, .xls) and CSV datasets. Automatic multi-sheet detection & intelligent column mapping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLoadSynthetic}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md border border-purple-400/40 transition"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            Load 100 Sample Invoices
          </button>
          <button
            onClick={onDownloadSample}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Download Template
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step 1: Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative p-8 md:p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20 shadow-2xl scale-[1.01]'
            : 'border-slate-700/80 hover:border-purple-500/60 bg-slate-900/60 hover:bg-slate-900/80 shadow-lg'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-4">
          <UploadCloud className="w-10 h-10 text-cyan-400 animate-pulse" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">
          {selectedFile ? selectedFile.name : 'Drag & drop invoice files here, or browse files'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md">
          Supported enterprise formats: <span className="text-cyan-300 font-mono">.XLSX</span>,{' '}
          <span className="text-cyan-300 font-mono">.XLS</span>,{' '}
          <span className="text-cyan-300 font-mono">.CSV</span>. Max file size: 50MB.
        </p>

        {selectedFile && (
          <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {(selectedFile.size / 1024).toFixed(1)} KB | {rawRows.length} rows detected
          </div>
        )}
      </div>

      {/* Step 2: Worksheet Selector & Column Mapping */}
      {step !== 'SELECT' && availableColumns.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-purple-900/40 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                Intelligent Column Mapping & Worksheet Configuration
              </h3>
              <p className="text-xs text-slate-400">
                Auto-mapped using fuzzy matching heuristics. You can override any field column selector below.
              </p>
            </div>

            {/* Sheet selector */}
            {sheetNames.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-400">Select Sheet:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-purple-500"
                >
                  {sheetNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Mapping Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'invoiceNumber', label: 'Invoice Number *', required: true },
              { key: 'vendorName', label: 'Vendor Name *', required: true },
              { key: 'invoiceDate', label: 'Invoice Date *', required: true },
              { key: 'dueDate', label: 'Due Date', required: false },
              { key: 'totalAmount', label: 'Total Amount *', required: true },
              { key: 'subtotal', label: 'Subtotal', required: false },
              { key: 'taxAmount', label: 'Tax Amount', required: false },
              { key: 'taxRate', label: 'Tax Rate (%)', required: false },
              { key: 'discount', label: 'Discount Amount', required: false },
              { key: 'shippingCharges', label: 'Shipping / Freight', required: false },
              { key: 'currency', label: 'Currency Code', required: false },
              { key: 'purchaseOrderNumber', label: 'PO Number', required: false },
            ].map(({ key, label, required }) => (
              <div key={key} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                  <span>{label}</span>
                  {required && <span className="text-[10px] text-rose-400 font-mono">Mandatory</span>}
                </label>
                <select
                  value={(columnMapping as any)[key] || ''}
                  onChange={(e) =>
                    setColumnMapping({
                      ...columnMapping,
                      [key]: e.target.value,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Ignore / Unmapped --</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-400 font-mono">
              Ready to process {rawRows.length} records into enterprise pipeline
            </span>
            <button
              onClick={handleConfirmAndProcess}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating & Detecting...</span>
                </>
              ) : (
                <>
                  <span>Execute Validation Engine</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
