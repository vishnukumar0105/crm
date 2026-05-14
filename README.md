# Employee Management Membership App

This project has two parts:
- **client**: React/Vite UI with Bootstrap, Bootstrap Icons, and jQuery success messages.
- **server**: Express API that can store the same membership data in either **MongoDB** or **MySQL**.

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

- `MembershipPlans` stores Free, Silver, and Gold plan definitions.
- `UserDetails` stores users who activate a membership.
- Every user document keeps a reference to the selected membership plan through `membershipPlan`.

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

- `membership_plans` stores Free, Silver, and Gold plan definitions.
- `user_details` stores users who activate a membership.
- `user_details.membership_plan_id` references `membership_plans.id`.

Before starting the server in MySQL mode, create the database once:

```sql
CREATE DATABASE IF NOT EXISTS Subscription;
```

The server will create the two tables automatically if they do not exist.

## 5) Successful Server Output

For MongoDB, successful output looks like:

```text
Server running on http://localhost:5000
Database provider: mongodb
Database connected: Subscription
User store: UserDetails
Membership plan store: MembershipPlans
```

For MySQL, successful output looks like:

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

Example body:

```json
{
  "key": "silver",
  "title": "Silver",
  "price": "$29",
  "priceAmount": 29,
  "period": "/month",
  "validityDays": 30,
  "description": "Built for growing teams that need automation.",
  "features": ["Up to 100 employees", "Payroll exports", "Shift scheduling"],
  "cta": "Choose Silver",
  "popular": true,
  "sortOrder": 2
}
```

### Get Activated User List

```http
GET /api/memberships
```

Also available as:

```http
GET /api/users
```

Both endpoints read users from the active database provider and include the selected membership plan data.

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

database.UserDetails.find({ status: 'active' }).sort({ updatedAt: -1 });
```

### MySQL

```sql
USE Subscription;

SELECT * FROM membership_plans;

SELECT * FROM user_details;

SELECT users.full_name, users.email, users.company, users.phone, users.plan_title, users.status,
       users.activated_at, users.expires_at
FROM user_details users
ORDER BY users.updated_at DESC;
```

## 9) Normal Run Order

You must run both apps:

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
5. Click the admin icon to see user and plan data from the active database provider.
6. Open MongoDB Compass or MySQL Workbench to see the same saved data in the database.

## 10) Important Note About the Client API Constant

This is not a dummy database:

```js
const MEMBERS_API = `${API_BASE_URL}/api/memberships`;
```

That line is only the frontend API URL. The browser sends form data to the Express server at `/api/memberships`, and the server saves it dynamically into the selected database provider.

## Tech Stack

- ReactJS
- Express
- MongoDB with Mongoose
- MySQL with mysql2
- Bootstrap 5
- Bootstrap Icons
- jQuery
