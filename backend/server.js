import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import newsRoutes from './routes/newsRoutes.js';
import alertsRoutes from './routes/alertsRoutes.js';
import logsRoutes from './routes/logsRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import { isSupabaseConfigured } from './services/supabaseClient.js';
import { fetchLiveNews } from './services/newsService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/users', usersRoutes);

// Health & System Status Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Global Intel & Telemetry (UGI)',
    timestamp: new Date().toISOString(),
    supabaseConnected: isSupabaseConfigured,
    autoRefreshIntervalSeconds: 45
  });
});

// Automated Background Sync Engine (Refreshes real news & alerts every 45s)
let syncInterval = null;
function startBackgroundSync() {
  console.log('🔄 [Telemetry Engine] Starting background ingestion loop (45s interval)...');
  
  // Initial fetch on boot
  fetchLiveNews('global', 'all')
    .then(items => console.log(`🚀 [Telemetry Engine] Initial boot ingestion completed: ${items.length} articles`))
    .catch(err => console.error('⚠️ [Telemetry Engine] Initial boot sync warning:', err.message));

  const hotspots = [
    'global', 'us', 'ukraine', 'russia', 'china', 'israel', 'iran', 
    'taiwan', 'india', 'germany', 'france', 'australia', 'brazil', 'canada', 'syria'
  ];
  let hotspotIndex = 0;

  syncInterval = setInterval(async () => {
    try {
      const targetCountry = hotspots[hotspotIndex % hotspots.length];
      hotspotIndex++;
      console.log(`⏱️ [Auto-Sync] Polling real-time intel for hotspot: ${targetCountry.toUpperCase()}`);
      await fetchLiveNews(targetCountry, 'all');
    } catch (err) {
      console.error('⚠️ [Auto-Sync Error]:', err.message);
    }
  }, 30000);
}

// Start Server
app.listen(PORT, () => {
  console.log(`
  =============================================================
  🌐 GLOBAL INTEL & TELEMETRY (UGI) - BACKEND SERVER
  =============================================================
  🟢 Server running on: http://localhost:${PORT}
  🗄️  Supabase Status:   ${isSupabaseConfigured ? 'CONNECTED ✅' : 'PENDING CONFIG (.env) ⚠️'}
  📡 Real News Engine:  ACTIVE (Google News Live & Global Feeds)
  🚨 Alert Engine:      ACTIVE (Real-time Keyword & Risk Scanner)
  =============================================================
  `);

  startBackgroundSync();
});

// Clean termination handling
process.on('SIGINT', () => {
  if (syncInterval) clearInterval(syncInterval);
  process.exit(0);
});
