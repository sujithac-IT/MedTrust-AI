// src/index.ts
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Placeholder routes (will be expanded)
app.post('/api/auth/login', (req, res) => {
  // TODO: implement auth
  res.json({ token: 'mock-jwt-token', role: req.body.role || 'doctor' });
});

// Start HTTP server
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  // Placeholder for signaling/events
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
