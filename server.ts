import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Logs directory
  const logsDir = path.resolve(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Ensure log files exist
  const logFiles = ['application.log', 'error.log', 'processing.log', 'audit.log'];
  const nowStr = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

  logFiles.forEach((file) => {
    const filePath = path.join(logsDir, file);
    if (!fs.existsSync(filePath)) {
      const initialEntry = `${nowStr()} | INFO | SYSTEM | Application Started | Initialized log file ${file} | SUCCESS\n`;
      fs.writeFileSync(filePath, initialEntry, 'utf-8');
    }
  });

  // Helper to append log
  const writeLog = (
    level: string,
    moduleName: string,
    action: string,
    message: string,
    status: string = 'SUCCESS',
    targetFile: string = 'application.log'
  ) => {
    const timestamp = nowStr();
    const entry = `${timestamp} | ${level.toUpperCase()} | ${moduleName.toUpperCase()} | ${action} | ${message} | ${status}\n`;

    // Append to specific log file
    const filePath = path.join(logsDir, targetFile);
    fs.appendFileSync(filePath, entry, 'utf-8');

    // Also mirror to application.log if it was written to processing or audit
    if (targetFile !== 'application.log') {
      const appLogPath = path.join(logsDir, 'application.log');
      fs.appendFileSync(appLogPath, entry, 'utf-8');
    }

    // If warning, error, or critical, mirror to error.log
    if (['WARNING', 'ERROR', 'CRITICAL'].includes(level.toUpperCase())) {
      const errLogPath = path.join(logsDir, 'error.log');
      fs.appendFileSync(errLogPath, entry, 'utf-8');
    }

    // If audit related, mirror to audit.log
    if (moduleName.toUpperCase() === 'AUDIT' || action.toLowerCase().includes('resolve') || action.toLowerCase().includes('override')) {
      const auditLogPath = path.join(logsDir, 'audit.log');
      if (targetFile !== 'audit.log') {
        fs.appendFileSync(auditLogPath, entry, 'utf-8');
      }
    }
  };

  // Record startup
  writeLog('INFO', 'SYSTEM', 'Server Initialization', 'Invoice Intelligence 360 Core Engine Online', 'SUCCESS');

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API: Get logs with query filtering
  app.get('/api/logs', (req, res) => {
    try {
      const file = (req.query.file as string) || 'application.log';
      const safeFile = path.basename(file);
      const filePath = path.join(logsDir, safeFile);

      if (!fs.existsSync(filePath)) {
        return res.json({ logs: [], total: 0, file: safeFile });
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      const parsed = lines.map((line, idx) => {
        const parts = line.split(' | ');
        return {
          id: idx + 1,
          timestamp: parts[0] || '',
          level: parts[1] || 'INFO',
          module: parts[2] || 'SYSTEM',
          action: parts[3] || '',
          message: parts[4] || '',
          status: parts[5] || 'SUCCESS',
          raw: line,
        };
      }).reverse(); // Most recent first

      const levelFilter = req.query.level ? String(req.query.level).toUpperCase() : '';
      const moduleFilter = req.query.module ? String(req.query.module).toUpperCase() : '';
      const searchFilter = req.query.search ? String(req.query.search).toLowerCase() : '';

      const filtered = parsed.filter((item) => {
        if (levelFilter && levelFilter !== 'ALL' && item.level !== levelFilter) return false;
        if (moduleFilter && moduleFilter !== 'ALL' && item.module !== moduleFilter) return false;
        if (searchFilter) {
          return (
            item.action.toLowerCase().includes(searchFilter) ||
            item.message.toLowerCase().includes(searchFilter) ||
            item.module.toLowerCase().includes(searchFilter)
          );
        }
        return true;
      });

      return res.json({
        logs: filtered.slice(0, 300),
        total: filtered.length,
        file: safeFile,
        availableFiles: logFiles,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // API: Append real log
  app.post('/api/log', (req, res) => {
    try {
      const { level, module: mod, action, message, status, file } = req.body;
      writeLog(
        level || 'INFO',
        mod || 'PROCESSING',
        action || 'General Event',
        message || '',
        status || 'SUCCESS',
        file || 'application.log'
      );
      return res.json({ success: true, timestamp: nowStr() });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // API: Download log file
  app.get('/api/logs/download/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(logsDir, filename);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/plain');
      return res.sendFile(filePath);
    }
    return res.status(404).send('Log file not found');
  });

  // API: Health status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'Invoice Intelligence 360',
      timestamp: nowStr(),
      logDirectory: logsDir,
    });
  });

  // Dev server or Production static
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Invoice Intelligence 360 full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
