# VideoTube Backend

> **Author: Devesh Tanwar**  
> A production-ready YouTube clone backend built with Node.js, Express, MongoDB Atlas & Cloudinary.

---

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Runtime     | Node.js (ESM)                       |
| Framework   | Express.js                          |
| Database    | MongoDB Atlas + Mongoose v8         |
| Auth        | JWT (Access + Refresh tokens)       |
| File Upload | Multer → Cloudinary                 |
| Email       | Nodemailer + Mailgen                |
| Validation  | express-validator                   |

---

## Project Structure

```
videotube/
├── public/
│   └── temp/                        # Multer temp files (auto-cleaned)
├── src/
│   ├── config/
│   │   ├── constants.js             # Enums, cookie options, folder names
│   │   └── cloudinary.js            # Cloudinary upload/delete helpers
│   ├── controllers/
│   │   ├── auth.controller.js       # Register, login, logout, forgot/reset password…
│   │   ├── video.controller.js      # Upload, view (auto-increment), CRUD
│   │   ├── comment.controller.js    # Add, edit, delete comments
│   │   ├── playlist.controller.js   # Create, manage, add/remove videos
│   │   ├── like.controller.js       # Toggle like on video/comment/post
│   │   ├── communityPost.controller.js
│   │   ├── subscription.controller.js
│   │   ├── dashboard.controller.js  # Channel stats, videos, public profile
│   │   └── healthcheck.controller.js
│   ├── db/
│   │   └── index.js                 # MongoDB Atlas connection
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── multer.middleware.js     # File upload (image + video presets)
│   │   └── errorHandler.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── video.model.js
│   │   ├── comment.model.js
│   │   ├── playlist.model.js
│   │   ├── like.model.js
│   │   ├── communityPost.model.js
│   │   └── subscription.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── video.routes.js
│   │   ├── comment.routes.js
│   │   ├── playlist.routes.js
│   │   ├── like.routes.js
│   │   ├── communityPost.routes.js
│   │   ├── subscription.routes.js
│   │   ├── dashboard.routes.js
│   │   └── healthcheck.routes.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── generateTokens.js
│   │   └── mailer.js               # Nodemailer + Mailgen templates
│   ├── validators/
│   │   ├── validate.js             # express-validator result handler
│   │   ├── auth.validator.js
│   │   ├── video.validator.js
│   │   ├── comment.validator.js
│   │   ├── playlist.validator.js
│   │   └── communityPost.validator.js
│   ├── app.js
│   └── index.js
├── .env.example
├── .gitignore
└── package.json
```

---

## Quick Start

```bash
# 1. Clone & install
git clone <repo-url> && cd videotube
npm install

# 2. Set up env
cp .env.example .env
# Fill in all values in .env

# 3. Run dev server
npm run dev
```

---

## Environment Variables

| Variable                  | Description                            |
| ------------------------- | -------------------------------------- |
| `PORT`                    | Server port (default 8000)             |
| `MONGODB_URI`             | MongoDB Atlas connection string        |
| `ACCESS_TOKEN_SECRET`     | JWT access token secret                |
| `ACCESS_TOKEN_EXPIRY`     | e.g. `15m`                             |
| `REFRESH_TOKEN_SECRET`    | JWT refresh token secret               |
| `REFRESH_TOKEN_EXPIRY`    | e.g. `7d`                              |
| `CLOUDINARY_CLOUD_NAME`   | Your Cloudinary cloud name             |
| `CLOUDINARY_API_KEY`      | Cloudinary API key                     |
| `CLOUDINARY_API_SECRET`   | Cloudinary API secret                  |
| `SMTP_HOST`               | SMTP host (e.g. `smtp.gmail.com`)      |
| `SMTP_PORT`               | SMTP port (e.g. `587`)                 |
| `SMTP_USER`               | SMTP email address                     |
| `SMTP_PASS`               | SMTP app password                      |
| `APP_NAME`                | `VideoTube`                            |
| `APP_URL`                 | Backend URL (e.g. `http://localhost:8000`) |
| `CLIENT_URL`              | Frontend URL (for email reset links)   |

---

## API Reference

All routes are prefixed with `/api/v1`.

### Auth — `/api/v1/auth`

| Method | Endpoint                          | Auth | Description                   |
| ------ | --------------------------------- | ---- | ----------------------------- |
| POST   | `/register`                       | No   | Register + send verify email  |
| POST   | `/login`                          | No   | Login → access + refresh token|
| POST   | `/logout`                         | Yes  | Logout + clear cookies        |
| POST   | `/refresh-token`                  | No   | Get new access token          |
| GET    | `/me`                             | Yes  | Get current user              |
| GET    | `/verify-email/:token`            | No   | Verify email address          |
| POST   | `/resend-verification`            | Yes  | Resend verification email     |
| POST   | `/forgot-password`                | No   | Send password reset email     |
| POST   | `/reset-password/:token`          | No   | Reset password with token     |
| PATCH  | `/change-password`                | Yes  | Change current password       |
| PATCH  | `/change-username`                | Yes  | Change username               |
| PATCH  | `/avatar`                         | Yes  | Update profile avatar         |
| GET    | `/watch-history`                  | Yes  | Get video watch history       |
| DELETE | `/watch-history`                  | Yes  | Clear watch history           |
| DELETE | `/account`                        | Yes  | Delete account permanently    |

### Videos — `/api/v1/videos`

| Method | Endpoint                  | Auth | Description                          |
| ------ | ------------------------- | ---- | ------------------------------------ |
| GET    | `/`                       | No   | List videos (search, sort, paginate) |
| POST   | `/`                       | Yes  | Upload video + thumbnail             |
| GET    | `/:videoId`               | Yes  | Get video (auto-increments views)    |
| PATCH  | `/:videoId`               | Yes  | Update title/description/thumbnail   |
| PATCH  | `/:videoId/toggle-publish`| Yes  | Toggle publish status                |
| DELETE | `/:videoId`               | Yes  | Delete video (removes from Cloudinary)|

### Comments — `/api/v1/comments`

| Method | Endpoint       | Auth | Description          |
| ------ | -------------- | ---- | -------------------- |
| GET    | `/:videoId`    | No   | Get video comments   |
| POST   | `/:videoId`    | Yes  | Add comment          |
| PATCH  | `/:commentId`  | Yes  | Edit own comment     |
| DELETE | `/:commentId`  | Yes  | Delete own comment   |

### Playlists — `/api/v1/playlists`

| Method | Endpoint                          | Auth | Description               |
| ------ | --------------------------------- | ---- | ------------------------- |
| POST   | `/`                               | Yes  | Create playlist           |
| GET    | `/user/:userId`                   | No   | Get user's playlists      |
| GET    | `/:playlistId`                    | No   | Get playlist with videos  |
| PATCH  | `/:playlistId`                    | Yes  | Update playlist info      |
| DELETE | `/:playlistId`                    | Yes  | Delete playlist           |
| PATCH  | `/:playlistId/videos/:videoId`    | Yes  | Add video to playlist     |
| DELETE | `/:playlistId/videos/:videoId`    | Yes  | Remove video from playlist|

### Likes — `/api/v1/likes`

| Method | Endpoint               | Auth | Description                  |
| ------ | ---------------------- | ---- | ---------------------------- |
| POST   | `/video/:videoId`      | Yes  | Toggle like on video         |
| POST   | `/comment/:commentId`  | Yes  | Toggle like on comment       |
| POST   | `/post/:postId`        | Yes  | Toggle like on community post|
| GET    | `/videos`              | Yes  | Get all liked videos         |

### Community Posts — `/api/v1/posts`

| Method | Endpoint              | Auth | Description              |
| ------ | --------------------- | ---- | ------------------------ |
| GET    | `/channel/:userId`    | No   | Get channel's posts      |
| POST   | `/`                   | Yes  | Create post (+ image)    |
| PATCH  | `/:postId`            | Yes  | Edit own post            |
| DELETE | `/:postId`            | Yes  | Delete own post          |

### Subscriptions — `/api/v1/subscriptions`

| Method | Endpoint                          | Auth | Description                   |
| ------ | --------------------------------- | ---- | ----------------------------- |
| GET    | `/channel/:channelId`             | No   | Get subscriber count + status |
| GET    | `/channel/:channelId/subscribers` | No   | Get subscriber list           |
| POST   | `/channel/:channelId`             | Yes  | Toggle subscribe/unsubscribe  |
| GET    | `/`                               | Yes  | Get subscribed channels       |

### Dashboard — `/api/v1/dashboard`

| Method | Endpoint              | Auth | Description                       |
| ------ | --------------------- | ---- | --------------------------------- |
| GET    | `/channel/:channelId` | No   | Public channel profile            |
| GET    | `/stats`              | Yes  | My channel stats (views, subs...) |
| GET    | `/videos`             | Yes  | My uploaded videos with analytics |

### Health Check — `/api/v1/healthcheck`

| Method | Endpoint | Auth | Description       |
| ------ | -------- | ---- | ----------------- |
| GET    | `/`      | No   | Server + DB status|

---

## Response Format

```json
// Success
{ "statusCode": 200, "data": { ... }, "message": "...", "success": true }

// Error
{ "statusCode": 422, "message": "Validation failed", "success": false,
  "errors": [{ "field": "email", "message": "Please provide a valid email" }] }
```

---

## Key Design Notes

- **Views** — every `GET /api/v1/videos/:videoId` increments `views` by 1 atomically via `$inc`
- **Watch history** — `$addToSet` prevents duplicate entries; users can clear it
- **Likes** — a single `Like` collection handles videos, comments and posts via `targetType`
- **Subscriptions** — `subscriber` + `channel` are both `User` references (self-referential)
- **Mongoose v8** — all pre-hooks are async without `next()` (Mongoose v7+ pattern)
- **Cloudinary** — temp files are always deleted after upload (success or failure)
- **Emails** — Mailgen generates branded HTML + plaintext; Nodemailer delivers via SMTP
