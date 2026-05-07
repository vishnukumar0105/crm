# Employee Management Membership App

This project includes:
- **client**: React app (Vite) with Bootstrap 5, Bootstrap Icons, and jQuery success toasts.
- **server**: Express API that stores activated memberships in a MongoDB database collection.

## 1) Setup

### Backend
```bash
cd server
npm install
cp .env.example .env
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

## 2) MongoDB Database Setup

This version does **not** use browser `localStorage` and does **not** write to a local JSON file. Memberships are saved through the API into MongoDB.

Set your MongoDB connection in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/crm-app
```

For local MongoDB, you can use:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/crm-app
```

The MongoDB database name is taken from the URI path. In the examples above, the database is:

```text
crm-app
```

The membership table/collection name is:

```text
memberships
```

## 3) Running the Project Step by Step

Yes, you must run **both** the backend server and the frontend client:

- The **server** connects to MongoDB and exposes the membership API.
- The **client** is the UI you open in the browser.

### Terminal 1: Start the server first

From the project root:

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Successful server output should look like:

```text
Server running on http://localhost:5000
MongoDB connected: crm-app
Membership collection: memberships
```

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

## 4) Membership API

- `GET /api/memberships` — reads activated members from the MongoDB `memberships` collection.
- `POST /api/memberships` — creates or updates a member by email in the MongoDB `memberships` collection.

## 5) MongoDB Queries to View the Table/Collection

Once your server is connected to MongoDB and memberships are activated from the UI, you can view records in MongoDB Compass or MongoDB shell.

### MongoDB Compass

1. Open MongoDB Compass.
2. Connect using the same `MONGODB_URI` from `server/.env`.
3. Open database: `crm-app` (or your database name from the URI).
4. Open collection/table: `memberships`.

### MongoDB shell queries

```js
const database = db.getSiblingDB('crm-app');

database.memberships.find().pretty();

database.memberships.find({ status: 'active' }).sort({ updatedAt: -1 });

database.memberships.findOne({ email: 'user@example.com' });
```

## 6) Features

- Free, Silver, and Gold membership plans.
- No payment fields for Free plan.
- Payment fields for Silver and Gold plans.
- Activated member admin table.
- Editable profile modal.
- MongoDB-backed membership storage through API endpoints.

## 7) Tech Stack

- ReactJS
- Express
- MongoDB with Mongoose
- Bootstrap 5
- Bootstrap Icons
- jQuery for UI success notification
