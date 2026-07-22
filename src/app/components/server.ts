import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test Database Connection
prisma.$connect()
  .then(() => {
    console.log('✅ Successfully connected to MongoDB via Prisma');
  })
  .catch((err) => {
    const safeErr = String(err instanceof Error ? err.message : err).replace(/[\r\n]/g, ' ');
    console.error('❌ MongoDB connection error:', safeErr);
  });

// Basic Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'active', timestamp: new Date() });
});

// --- API Routes ---
// In a full system, you would import routers for auth, listings, etc.
// app.use('/api/auth', authRouter);
// app.use('/api/listings', listingRouter);
// app.use('/api/users', userRouter);

const server = app.listen(PORT, () => {
  console.log(`🚀 Roomie Backend running on http://localhost:${PORT}`);
});

// Handle Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});