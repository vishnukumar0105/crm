# Employee Management Membership App

This project includes:
- **client**: React app (Vite) with Bootstrap 5, Bootstrap Icons, and jQuery success toasts.
- **server**: Express API that stores activated memberships in a local query JSON file.

## 1) Setup

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:5000`

## 2) Local Query File Database

Activated memberships are stored in this file:

```text
server/data/memberships.query.json
```

You can open this file directly in your editor to see the latest activated members table data. The server automatically creates and updates this file when users activate or update memberships through the app.

## 3) Membership API

- `GET /api/memberships` — reads activated members from `server/data/memberships.query.json`.
- `POST /api/memberships` — creates or updates a member by email and writes the updated list back to `server/data/memberships.query.json`.

## 4) Features

- Free, Silver, and Gold membership plans.
- No payment fields for Free plan.
- Payment fields for Silver and Gold plans.
- Activated member admin table.
- Editable profile modal.
- Local file-backed member storage without MongoDB and without browser localStorage.

## 5) Tech Stack

- ReactJS
- Express
- Local JSON query file storage
- Bootstrap 5
- Bootstrap Icons
- jQuery for UI success notification
