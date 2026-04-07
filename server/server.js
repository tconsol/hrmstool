require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { setIO } = require('./utils/socket');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const calendarRoutes = require('./routes/calendar');
const debugRoutes = require('./routes/debug');
const documentRoutes = require('./routes/documents');
const organizationRoutes = require('./routes/organization');
const departmentRoutes = require('./routes/departments');
const designationRoutes = require('./routes/designations');
const holidayRoutes = require('./routes/holidays');
const announcementRoutes = require('./routes/announcements');
const expenseRoutes = require('./routes/expenses');
const shiftRoutes = require('./routes/shifts');
const assetRoutes = require('./routes/assets');
const trainingRoutes = require('./routes/training');
const superAdminRoutes = require('./routes/superAdmin');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Socket.IO
const allowedOriginsForIO = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOriginsForIO,
    credentials: true,
  },
});

setIO(io);

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(`user_${userId}`);
  }

  socket.on('disconnect', () => {
    // cleanup handled automatically by socket.io
  });
});

// Security middleware
app.use(helmet());

// Parse and normalize allowed origins
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files for payslips
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/superadmin', superAdminRoutes);

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ status: 'HRMS Server OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`HRMS Server running on port ${PORT}`);
});
