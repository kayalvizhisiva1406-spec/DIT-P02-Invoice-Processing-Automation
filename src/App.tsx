import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Header/Navbar';
import { Sidebar } from './components/Navigation/Sidebar';
import { DashboardView } from './views/DashboardView';
import { UploadView } from './views/UploadView';
import { ProcessingMonitorView } from './views/ProcessingMonitorView';
import { InvoiceRegisterView } from './views/InvoiceRegisterView';
import { ValidationResultsView } from './views/ValidationResultsView';
import { DuplicateDetectionView } from './views/DuplicateDetectionView';
import { ExceptionCenterView } from './views/ExceptionCenterView';
import { ReconciliationCenterView } from './views/ReconciliationCenterView';
import { AnalyticsView } from './views/AnalyticsView';
import { ReportCenterView } from './views/ReportCenterView';
import { AiAssistantView } from './views/AiAssistantView';
import { ActivityLogView } from './views/ActivityLogView';
import { AgileWorkspaceView } from './views/AgileWorkspaceView';
import { TestingQaView } from './views/TestingQaView';
import { DeliverablesView } from './views/DeliverablesView';
import { SettingsView } from './views/SettingsView';

import { InvoiceRecord, InvoiceException, PaymentRecord, ValidationSettings } from './types/invoice';
import { generateSyntheticInvoices, generateSyntheticPayments, exportInvoicesToExcel } from './services/syntheticData';
import { validateAllInvoices, DEFAULT_SETTINGS } from './services/validationEngine';
import { detectDuplicates, DuplicateGroup } from './services/duplicateEngine';
import { reconcileInvoicesWithPayments, ReconciliationSummary } from './services/reconciliationEngine';
import { logger } from './services/logger';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [settings, setSettings] = useState<ValidationSettings>(DEFAULT_SETTINGS);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [fileCount, setFileCount] = useState<number>(1);

  // Initialize with the realistic 100-invoice dataset on boot
  useEffect(() => {
    const raw = generateSyntheticInvoices(100);
    const pmt = generateSyntheticPayments(raw);
    setPayments(pmt);

    // Run initial validation & duplicate detection
    runFullProcessing(raw, pmt, settings, 'Synthetic_Enterprise_Invoices_100.xlsx');
  }, []);

  const runFullProcessing = (
    rawRecords: InvoiceRecord[],
    pmtRecords: PaymentRecord[],
    currentSettings: ValidationSettings,
    fileName: string = 'Current_Dataset'
  ) => {
    // 1. Validation Engine
    const validated = validateAllInvoices(rawRecords, currentSettings);

    // 2. Duplicate Detection Engine
    const { processedInvoices, duplicateGroups: groups } = detectDuplicates(validated, currentSettings);

    // 3. Reconciliation Engine
    const { reconciledInvoices } = reconcileInvoicesWithPayments(
      processedInvoices,
      pmtRecords,
      currentSettings.roundingTolerance
    );

    setInvoices(reconciledInvoices);
    setDuplicateGroups(groups);

    // Extract all exceptions
    const allExceptions: InvoiceException[] = [];
    reconciledInvoices.forEach((i) => {
      allExceptions.push(...i.exceptions);
    });

    const validCount = reconciledInvoices.filter((i) => i.validationStatus === 'VALID').length;
    const invalidCount = reconciledInvoices.filter((i) => i.validationStatus === 'INVALID').length;
    const duplicateCount = reconciledInvoices.filter((i) => i.duplicateStatus !== 'UNIQUE').length;

    logger.log(
      'INFO',
      'PROCESSING',
      `${fileName} Processed`,
      `Ingested ${reconciledInvoices.length} records: ${validCount} Valid, ${invalidCount} Invalid, ${duplicateCount} Duplicates, ${allExceptions.length} Exceptions`,
      'SUCCESS',
      'processing.log'
    );
  };

  // Re-run whenever settings change
  const handleUpdateSettings = (newSettings: ValidationSettings) => {
    setSettings(newSettings);
    runFullProcessing(invoices, payments, newSettings);
  };

  // Ingest uploaded files
  const handleProcessUploadedRecords = (uploaded: InvoiceRecord[], fileName: string) => {
    setFileCount((c) => c + 1);
    runFullProcessing(uploaded, payments, settings, fileName);
    setActiveTab('register');
  };

  // 1-Click Load 100 Sample Invoices
  const handleLoadSynthetic = () => {
    const sample = generateSyntheticInvoices(100);
    const samplePmt = generateSyntheticPayments(sample);
    setPayments(samplePmt);
    setFileCount((c) => c + 1);
    runFullProcessing(sample, samplePmt, settings, 'Synthetic_100_Reloaded.xlsx');
    setActiveTab('dashboard');
  };

  // Download sample template
  const handleDownloadSample = () => {
    const sample = generateSyntheticInvoices(100);
    exportInvoicesToExcel(sample, 'Invoice_Intelligence_360_Sample_100.xlsx');
    logger.log('INFO', 'UPLOAD', 'Sample Template Downloaded', '100 sample records exported to Excel', 'SUCCESS');
  };

  // Update auditor invoice review
  const handleUpdateInvoiceReview = (
    invoiceId: string,
    reviewStatus: 'APPROVED' | 'RESOLVED' | 'REJECTED',
    notes: string
  ) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              reviewStatus,
              reviewNotes: notes,
              validationStatus: reviewStatus === 'APPROVED' ? 'VALID' : inv.validationStatus,
            }
          : inv
      )
    );
    logger.log(
      'INFO',
      'AUDIT',
      `Invoice ${invoiceId} ${reviewStatus}`,
      `Review note: ${notes || 'Status updated by auditor'}`,
      'SUCCESS',
      'audit.log'
    );
  };

  // Resolve duplicate alert
  const handleResolveDuplicate = (invoiceId: string, action: 'MARK_UNIQUE' | 'CONFIRM_DUPLICATE') => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            duplicateStatus: action === 'MARK_UNIQUE' ? 'UNIQUE' : 'EXACT_DUPLICATE',
            validationStatus: action === 'MARK_UNIQUE' ? 'VALID' : 'INVALID',
          };
        }
        return inv;
      })
    );
  };

  // Resolve exception
  const handleResolveException = (exceptionId: string, resolutionNote: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        const updatedExceptions = inv.exceptions.map((exc) =>
          exc.id === exceptionId
            ? { ...exc, status: 'RESOLVED' as const, resolutionNote, resolvedAt: new Date().toISOString() }
            : exc
        );
        const hasUnresolvedCritical = updatedExceptions.some(
          (e) => e.status !== 'RESOLVED' && e.severity === 'CRITICAL'
        );
        return {
          ...inv,
          exceptions: updatedExceptions,
          validationStatus: hasUnresolvedCritical ? 'INVALID' : 'VALID',
        };
      })
    );
  };

  // Compute aggregated collections
  const allExceptions: InvoiceException[] = [];
  invoices.forEach((i) => allExceptions.push(...i.exceptions));

  const invalidCount = invoices.filter((i) => i.validationStatus === 'INVALID').length;
  const duplicateCount = invoices.filter((i) => i.duplicateStatus !== 'UNIQUE').length;

  const { summary: recSummary } = reconcileInvoicesWithPayments(
    invoices,
    payments,
    settings.roundingTolerance
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#080a14] text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navbar with official user logo */}
      <Navbar
        onLoadSyntheticData={handleLoadSynthetic}
        onDownloadSampleDataset={handleDownloadSample}
        recordCount={invoices.length}
        openLogViewer={() => setActiveTab('logs')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          exceptionCount={allExceptions.length}
          duplicateCount={duplicateCount}
          invalidCount={invalidCount}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              invoices={invoices}
              exceptions={allExceptions}
              onNavigate={setActiveTab}
              fileCount={fileCount}
            />
          )}

          {activeTab === 'upload' && (
            <UploadView
              onProcessRecords={handleProcessUploadedRecords}
              onLoadSynthetic={handleLoadSynthetic}
              onDownloadSample={handleDownloadSample}
            />
          )}

          {activeTab === 'monitor' && (
            <ProcessingMonitorView
              invoices={invoices}
              onTriggerFullRevalidation={() => runFullProcessing(invoices, payments, settings)}
            />
          )}

          {activeTab === 'register' && (
            <InvoiceRegisterView
              invoices={invoices}
              onUpdateInvoiceReview={handleUpdateInvoiceReview}
            />
          )}

          {activeTab === 'validation' && (
            <ValidationResultsView invoices={invoices} settings={settings} />
          )}

          {activeTab === 'duplicates' && (
            <DuplicateDetectionView
              invoices={invoices}
              duplicateGroups={duplicateGroups}
              onResolveDuplicate={handleResolveDuplicate}
            />
          )}

          {activeTab === 'exceptions' && (
            <ExceptionCenterView
              exceptions={allExceptions}
              onResolveException={handleResolveException}
            />
          )}

          {activeTab === 'reconciliation' && (
            <ReconciliationCenterView
              invoices={invoices}
              payments={payments}
              summary={recSummary}
              onUpdatePayments={(newPmts) => {
                setPayments(newPmts);
                runFullProcessing(invoices, newPmts, settings);
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView invoices={invoices} exceptions={allExceptions} />
          )}

          {activeTab === 'reports' && (
            <ReportCenterView
              invoices={invoices}
              exceptions={allExceptions}
              summary={recSummary}
              payments={payments}
            />
          )}

          {activeTab === 'ai-assistant' && (
            <AiAssistantView
              invoices={invoices}
              exceptions={allExceptions}
              summary={recSummary}
            />
          )}

          {activeTab === 'logs' && <ActivityLogView />}

          {activeTab === 'agile' && <AgileWorkspaceView />}

          {activeTab === 'testing' && <TestingQaView />}

          {activeTab === 'deliverables' && <DeliverablesView />}

          {activeTab === 'settings' && (
            <SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} />
          )}
        </main>
      </div>
    </div>
  );
}
