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


## 2) Running the Project Step by Step

Yes, you must run **both** the backend server and the frontend client:

- The **server** saves and reads activated members from `server/data/memberships.query.json`.
- The **client** is the UI you open in the browser.

### Terminal 1: Start the server first

From the project root:

```bash
cd server
npm install
npm run dev
```

Successful server output should look like:

```text
Server running on http://localhost:5000
Membership query file: .../server/data/memberships.query.json
```

Do not expect the membership UI to appear from the server terminal. The server is only the API.

### Terminal 2: Start the client second

Open a new terminal from the project root:

```bash
cd client
npm install
npm run dev
```

Then open the browser URL shown by Vite, usually:

```text
http://localhost:5173
```

### Important troubleshooting for MongoDB/Mongoose crash output

If your terminal shows MongoDB/Mongoose connection settings or an error mentioning MongoDB, you are running an old server version. The current server does **not** use MongoDB and does **not** depend on Mongoose.

To fix that locally:

1. Stop the server with `Ctrl + C`.
2. Make sure your `server/src/index.js` is the latest file-backed version.
3. Run `npm install` again inside `server` so dependencies match `server/package.json`.
4. Start again with `npm run dev`.

## 3) Local Query File Database

Activated memberships are stored in this file:

```text
server/data/memberships.query.json
```

You can open this file directly in your editor to see the latest activated members table data. The server automatically creates and updates this file when users activate or update memberships through the app.

## 4) Membership API

- `GET /api/memberships` — reads activated members from `server/data/memberships.query.json`.
- `POST /api/memberships` — creates or updates a member by email and writes the updated list back to `server/data/memberships.query.json`.

## 5) Features

- Free, Silver, and Gold membership plans.
- No payment fields for Free plan.
- Payment fields for Silver and Gold plans.
- Activated member admin table.
- Editable profile modal.
- Local file-backed member storage without MongoDB and without browser localStorage.

## 6) Tech Stack

- ReactJS
- Express
- Local JSON query file storage
- Bootstrap 5
- Bootstrap Icons
- jQuery for UI success notification
