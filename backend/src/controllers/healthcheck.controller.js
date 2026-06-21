import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthCheck = asyncHandler(async (_req, res) => {
  const dbState    = mongoose.connection.readyState;
  const dbStateMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

  return res.status(200).json(
    new ApiResponse(200, {
      status:      "OK",
      timestamp:   new Date().toISOString(),
      uptime:      `${Math.floor(process.uptime())}s`,
      environment: process.env.NODE_ENV || "development",
      database:    { status: dbStateMap[dbState] || "unknown" },
      memory: {
        heapUsed:  `${Math.round(process.memoryUsage().heapUsed  / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      },
    }, "Service is healthy")
  );
});
