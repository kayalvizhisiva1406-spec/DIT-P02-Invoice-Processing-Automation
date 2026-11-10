import { LogEntry } from '../types/invoice';

class LoggerService {
  private localLogs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    this.addInitialBootLog();
  }

  private addInitialBootLog() {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const bootLog: LogEntry = {
      id: 1,
      timestamp: now,
      level: 'INFO',
      module: 'SYSTEM',
      action: 'Application Started',
      message: 'Invoice Intelligence 360 initialized successfully with high-performance engine',
      status: 'SUCCESS',
      raw: `${now} | INFO | SYSTEM | Application Started | Initialized | SUCCESS`,
    };
    this.localLogs.push(bootLog);
  }

  public async log(
    level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'DEBUG',
    moduleName: string,
    action: string,
    message: string,
    status: string = 'SUCCESS',
    targetFile: string = 'application.log'
  ) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newEntry: LogEntry = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp,
      level,
      module: moduleName.toUpperCase(),
      action,
      message,
      status,
      raw: `${timestamp} | ${level} | ${moduleName.toUpperCase()} | ${action} | ${message} | ${status}`,
    };

    // Keep locally
    this.localLogs.unshift(newEntry);
    if (this.localLogs.length > 500) {
      this.localLogs.pop();
    }

    this.notify();

    // Send to backend server endpoint to persist to actual disk file
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          module: moduleName,
          action,
          message,
          status,
          file: targetFile,
        }),
      });
    } catch (e) {
      // In-browser fallback
      console.warn('Logging to server API fell back to client buffer:', e);
    }
  }

  public async fetchServerLogs(file: string = 'application.log', filterLevel?: string, search?: string): Promise<LogEntry[]> {
    try {
      const params = new URLSearchParams();
      params.set('file', file);
      if (filterLevel && filterLevel !== 'ALL') params.set('level', filterLevel);
      if (search) params.set('search', search);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch server logs');
      const data = await res.json();
      return data.logs || this.localLogs;
    } catch {
      return this.localLogs;
    }
  }

  public getRecentLogs(): LogEntry[] {
    return [...this.localLogs];
  }

  public subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const copy = [...this.localLogs];
    this.listeners.forEach((l) => l(copy));
  }
}

export const logger = new LoggerService();
