import React from 'react';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { ValidationSettings } from '../types/invoice';
import { DEFAULT_SETTINGS } from '../services/validationEngine';
import { logger } from '../services/logger';

interface SettingsViewProps {
  settings: ValidationSettings;
  onUpdateSettings: (newSettings: ValidationSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const handleToggle = (key: keyof ValidationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    onUpdateSettings(updated);
    logger.log('INFO', 'SYSTEM', 'Validation Rules Updated', `Modified setting: ${String(key)}`, 'SUCCESS');
  };

  const handleToleranceChange = (val: number) => {
    const updated = { ...settings, roundingTolerance: val };
    onUpdateSettings(updated);
    logger.log('INFO', 'SYSTEM', 'Rounding Tolerance Modified', `Tolerance set to $${val.toFixed(2)}`, 'SUCCESS');
  };

  const handleReset = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
    logger.log('INFO', 'SYSTEM', 'Settings Reset to Factory Defaults', 'All rules restored to enterprise baseline', 'SUCCESS');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            System Configuration & Audit Rules Engine
          </h2>
          <p className="text-xs text-slate-300">
            Configure validation tolerances, legal mandatory fields, duplicate detection thresholds, and treasury rules.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Validation Rules */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Mandatory Validation Rules
          </h3>

          <div className="space-y-3 text-xs">
            {[
              { key: 'strictMathCheck', title: 'Verify Total Mathematical Formula', desc: 'Subtotal + Tax + Shipping - Discount = Total' },
              { key: 'requireInvoiceNumber', title: 'Require Non-Empty Invoice Number', desc: 'Flag invoices missing legal identifier as Critical' },
              { key: 'requireVendorName', title: 'Require Valid Vendor Name', desc: 'Enforce payee entity presence' },
              { key: 'requireValidDate', title: 'Validate Chronological Dates', desc: 'Detect invalid calendars & unparseable strings' },
              { key: 'requireDueDate', title: 'Enforce Due Date >= Invoice Date', desc: 'Prevent inverted payment terms' },
              { key: 'disallowNegativeAmounts', title: 'Flag Negative Balances', desc: 'Route credit adjustments to separate ledger' },
            ].map(({ key, title, desc }) => (
              <div
                key={key}
                onClick={() => handleToggle(key as keyof ValidationSettings)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition"
              >
                <div>
                  <div className="font-semibold text-slate-200">{title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>
                </div>

                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    (settings as any)[key] ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      (settings as any)[key] ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tolerances & Duplicates */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            Financial Tolerances & Duplicate Proximity
          </h3>

          <div className="space-y-4 text-xs">
            {/* Rounding tolerance */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">Financial Rounding Tolerance</span>
                <span className="font-mono text-cyan-300 font-bold">
                  ±${settings.roundingTolerance.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Permissible discrepancy between calculated line-item formula and vendor stated gross amount.
              </p>
              <div className="flex gap-2 pt-1">
                {[0.00, 0.05, 0.10, 0.50].map((tol) => (
                  <button
                    key={tol}
                    onClick={() => handleToleranceChange(tol)}
                    className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      settings.roundingTolerance === tol
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    ${tol.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            {/* Duplicate proximity window */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">Potential Duplicate Proximity Window</span>
                <span className="font-mono text-purple-300 font-bold">
                  {settings.duplicateWindowDays} Days
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Flags separate invoices with identical amounts from the same vendor within this day window.
              </p>
            </div>

            {/* Allowed currencies */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="font-semibold text-slate-200">Whitelisted Treasury Currencies</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {settings.allowedCurrencies.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
