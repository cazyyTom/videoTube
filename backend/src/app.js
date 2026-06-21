import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Routes
import authRoutes          from "./routes/auth.routes.js";
import videoRoutes         from "./routes/video.routes.js";
import commentRoutes       from "./routes/comment.routes.js";
import playlistRoutes      from "./routes/playlist.routes.js";
import likeRoutes          from "./routes/like.routes.js";
import communityPostRoutes from "./routes/communityPost.routes.js";
import subscriptionRoutes  from "./routes/subscription.routes.js";
import dashboardRoutes     from "./routes/dashboard.routes.js";
import healthCheckRoutes   from "./routes/healthcheck.routes.js";

// Middlewares
import errorHandler from "./middlewares/errorHandler.middleware.js";

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = "/api/v1";

app.use(`${API}/auth`,           authRoutes);
app.use(`${API}/videos`,         videoRoutes);
app.use(`${API}/comments`,       commentRoutes);
app.use(`${API}/playlists`,      playlistRoutes);
app.use(`${API}/likes`,          likeRoutes);
app.use(`${API}/posts`,          communityPostRoutes);
app.use(`${API}/subscriptions`,  subscriptionRoutes);
app.use(`${API}/dashboard`,      dashboardRoutes);
app.use(`${API}/healthcheck`,    healthCheckRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, statusCode: 404, message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export { app };
