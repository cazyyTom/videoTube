import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './db/index.js';
import { app } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure temp upload directory exists
const tempDir = path.resolve(__dirname, '../public/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 VideoTube server running on port ${PORT}`);
      console.log(`📡 Environment  : ${process.env.NODE_ENV || 'development'}`);
      console.log(
        `🔗 Health check : http://localhost:${PORT}/api/v1/healthcheck`,
      );
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
