// Deploy Trigger: New rules and stats routes added
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const leaderRoutes = require('./routes/leaderRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const eventRoutes = require('./routes/eventRoutes');
const claimRoutes = require('./routes/claimRoutes');
const changeRequestRoutes = require('./routes/changeRequestRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// ─── Middleware ───────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://evergreen-two-alpha.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true
  }
});

// Make io accessible globally via app
app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('📡 Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });
});

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/leaders', leaderRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/change-requests', changeRequestRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/stats', statsRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Evergreen Welfare API is running', timestamp: new Date() });
});

// Root route (for users visiting the backend URL directly)
app.get('/', (req, res) => {
  res.send('<h2>Evergreen Community Backend API is live! 🚀</h2><p>Your frontend should connect to <code>/api</code>.</p>');
});

// ─── Serve Frontend in Production ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
  });
} else {
  // ─── 404 Handler ─────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  });
}

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Evergreen API running on http://localhost:${PORT}`);
});
