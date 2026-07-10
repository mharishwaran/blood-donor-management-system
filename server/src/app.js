import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

import { generalLimiter } from './middlewares/rateLimiter.js';
import passport from './config/passport.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import debugRoutes from './routes/debugRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';

import { sendResponse } from './utils/response.js';
const app = express();

app.use((req, res, next) => {
  console.log("🔥", req.method, req.originalUrl);
  next();
});

app.set("trust proxy", 1);

app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl);
  next();
});

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "https://blood-donor-management-sys.netlify.app",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked Origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

// IMPORTANT
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use(passport.initialize());

// Rate limiter AFTER body parser
//app.use(generalLimiter);

app.get("/api/health", (req, res) => {
  return sendResponse(res, 200, true, "Server is healthy");
});

app.use("/api/auth", authRoutes);app.use('/api/admin', adminRoutes);app.use("/api/debug", debugRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/emergency-requests", emergencyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({
    success: false,
    message: err.message
  });
});

export default app;