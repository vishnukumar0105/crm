# Employee Management Membership App

This project has two parts:
- **client**: React/Vite UI with Bootstrap, Bootstrap Icons, and jQuery success messages.
- **server**: Express API that stores membership plans and activated members in the configured database provider.

This version does **not** use browser `localStorage` and does **not** write to a local JSON file.

## 1) Choose Database Provider

The backend is controlled by this setting in `server/.env`:

```env
DB_PROVIDER=mongodb
```

Supported values:

```text
mongodb
mysql
```

The React client does not change when you switch databases. It always calls the same API endpoints:

```text
GET  /api/membership-plans
GET  /api/memberships
POST /api/memberships
```

The server decides whether those API calls go to MongoDB or MySQL based on `DB_PROVIDER`.

## 2) Backend Setup

Create the real environment file from the example:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

On Windows CMD, use this copy command instead:

```cmd
copy .env.example .env
```

## 3) MongoDB Setup

Use this when you want the API to save into MongoDB.

```env
PORT=5000
DB_PROVIDER=mongodb
MONGODB_SERVER=192.168.10.218:27017
MONGODB_DATABASE=Subscription
MONGODB_USERNAME=dev
MONGODB_PASSWORD="your_mongodb_password_here"
MONGODB_AUTH_SOURCE=admin
```

MongoDB database:

```text
Subscription
```

MongoDB collections:

```text
UserDetails
MembershipPlans
```

Passwords with special characters like `#`, `$`, and `@` should stay inside double quotes in `.env`.

## 4) MySQL Setup

Use this when you want the same API to save into MySQL instead.

```env
PORT=5000
DB_PROVIDER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=Subscription
MYSQL_USER=root
MYSQL_PASSWORD="your_mysql_password_here"
MYSQL_CONNECTION_LIMIT=10
```

MySQL database:

```text
Subscription
```

MySQL tables created automatically by the server:

```text
membership_plans
user_details
```

Before starting the server in MySQL mode, create the database once:

```sql
CREATE DATABASE IF NOT EXISTS Subscription;
```

The server will create the two tables automatically if they do not exist.

## 5) Successful Server Output

For MongoDB:

```text
Server running on http://localhost:5000
Database provider: mongodb
Database connected: Subscription
User store: UserDetails
Membership plan store: MembershipPlans
```

For MySQL:

```text
Server running on http://localhost:5000
Database provider: mysql
Database connected: Subscription
User store: user_details
Membership plan store: membership_plans
```

## 6) Frontend Setup

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the React app:

```text
http://localhost:5173
```

By default, the client calls the backend here:

```text
http://localhost:5000
```

If your backend API is deployed on another URL, create `client/.env`:

```env
VITE_API_BASE_URL=https://your-live-api-domain.com
```

## 7) API Endpoints

### Health Check

```http
GET /api/health
```

Returns the active database provider, database name, user store, and plan store.

### Get Membership Plans

```http
GET /api/membership-plans
```

Reads Free, Silver, and Gold plans from the active database provider.

### Create or Update Membership Plan

```http
POST /api/membership-plans
Content-Type: application/json
```

### Get Activated User List

```http
GET /api/memberships
```

Also available as:

```http
GET /api/users
```

### Activate Membership / Save User

```http
POST /api/memberships
Content-Type: application/json
```

Example body:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "company": "Demo Company",
  "phone": "9999999999",
  "planKey": "gold",
  "paymentMethod": "Credit Card",
  "cardName": "John Doe",
  "cardNumber": "4111111111111111",
  "expiryDate": "12/28"
}
```

The server calculates `activatedAt` and `expiresAt` from the selected plan validity. For safety, it stores only `cardLast4`; it does not store full card numbers or CVV.

## 8) Queries to View Data

### MongoDB shell

```js
const database = db.getSiblingDB('Subscription');

database.MembershipPlans.find().pretty();

database.UserDetails.find().pretty();
```

### MySQL

```sql
USE Subscription;

SELECT * FROM membership_plans;

SELECT * FROM user_details;
```

## 9) Normal Run Order

1. Start backend server first:
   ```bash
   cd server
   npm run dev
   ```
2. Start frontend client second:
   ```bash
   cd client
   npm run dev
   ```
3. Open:
   ```text
   http://localhost:5173
   ```
4. Activate a plan from the UI.
5. Click the admin icon to see activated members and plans from the configured database provider.

## Tech Stack

- ReactJS
- Express
- MongoDB with Mongoose
- MySQL with mysql2
- Bootstrap 5
- Bootstrap Icons
- jQuery
