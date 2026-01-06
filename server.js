import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import grantRoutes from './routes/grantRoutes.js';
import scholarshipRoutes from './routes/scholarshipRoutes.js';
import donationRoutes from './routes/donationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common document formats
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from frontend build (production)
app.use(express.static(path.join(__dirname, 'public', 'build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running successfully!' });
});

// Routes with file upload middleware
app.use('/api/forms', upload.array('files', 10), grantRoutes);
app.use('/api/forms', upload.array('files', 10), scholarshipRoutes);
app.use('/api/forms', upload.array('files', 10), donationRoutes);

// Serve frontend for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'build', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Frontend files not found. Please build and copy frontend files to public/build' });
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📧 Emails will be sent to: ${process.env.COMPANY_EMAIL}`);
  console.log(`🌐 Frontend files served from: ${path.join(__dirname, 'public', 'build')}`);
});
