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

The server decides where normal writes go based on `DB_PROVIDER`. For the RnD viewer icons, the backend can also connect to both providers and expose provider-specific read endpoints.

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

## 7) RnD MongoDB and MySQL Viewer Icons

The top-right admin icon has been replaced with two provider icons:

```text
MongoDB icon
MySQL icon
```

Clicking the MongoDB icon opens the members and plans stored in MongoDB. Clicking the MySQL icon opens the members and plans stored in MySQL.

To allow both icons to read both databases in one server run, keep this in `server/.env`:

```env
DB_COMPARE_PROVIDERS=mongodb,mysql
```

Normal reads use `DB_PROVIDER`, and membership form submissions are saved to every provider listed in `DB_WRITE_PROVIDERS`. For your RnD screen, keep `DB_WRITE_PROVIDERS=mongodb,mysql` so new activated members appear in both MongoDB and MySQL viewer popups. The provider-specific icon endpoints are read-only viewer APIs for comparison.

If MySQL plans appear but MySQL members are empty, it usually means previous form submissions were saved only to MongoDB. New submissions will be mirrored to both databases when this is present in `server/.env`:

```env
DB_WRITE_PROVIDERS=mongodb,mysql
```

After changing it, restart the backend and submit the membership form again. Existing MongoDB-only users are not automatically copied into MySQL; activate/edit-submit that member again or migrate the old rows manually.

### If the MySQL icon says MySQL is not connected

The MySQL icon reads from these provider-specific APIs, so the server must be able to open a MySQL connection in the same backend process:

```env
DB_COMPARE_PROVIDERS=mongodb,mysql
DB_WRITE_PROVIDERS=mongodb,mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=Subscription
MYSQL_USER=root
MYSQL_PASSWORD="your_mysql_password_here"
```

After changing `server/.env`, stop and restart the backend. You can verify both viewer connections at:

```text
http://localhost:5000/api/health
```

The `providers.mysql` value should be `true`. If it is `false`, check the `providerErrors.mysql` value returned by `/api/health`; it will show the exact MySQL connection/import problem.

If you see this error:

```text
connect ECONNREFUSED 127.0.0.1:3306
```

It means the backend tried to connect to MySQL on your own machine at port `3306`, but no MySQL server accepted the connection there. Fix one of these:

1. Start your local MySQL server if MySQL is installed locally.
2. If MySQL is on another server, change `MYSQL_HOST` from `127.0.0.1` to the real MySQL host/IP.
3. If MySQL uses another port, change `MYSQL_PORT` from `3306` to the real port.
4. Confirm the database exists:
   ```sql
   CREATE DATABASE IF NOT EXISTS Subscription;
   ```
5. Restart the backend after changing `server/.env`.



If you see this error:

```text
Access denied for user 'root'@'192.168.0.151' (using password: YES)
```

It means the MySQL server is reachable, but MySQL rejected the login. The part after `@` is the client machine/IP that MySQL sees. Fix one of these:

1. Confirm `MYSQL_USER` and `MYSQL_PASSWORD` in `server/.env` are correct.
2. Avoid using `root` remotely if your MySQL server blocks remote root login. Create an app user instead.
3. Grant the MySQL user permission from your client IP or from `%` if this is only for local/RnD.
4. Example MySQL commands an admin can run on the MySQL server:
   ```sql
   CREATE USER IF NOT EXISTS 'dev'@'192.168.0.151' IDENTIFIED BY 'your_password_here';
   GRANT ALL PRIVILEGES ON Subscription.* TO 'dev'@'192.168.0.151';
   FLUSH PRIVILEGES;
   ```
5. Then update `server/.env`:
   ```env
   MYSQL_USER=dev
   MYSQL_PASSWORD="your_password_here"
   ```
6. Restart the backend after changing `server/.env`.

## 8) API Endpoints

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

### Provider-Specific Viewer APIs

```http
GET /api/providers/mongodb/memberships
GET /api/providers/mongodb/membership-plans
GET /api/providers/mysql/memberships
GET /api/providers/mysql/membership-plans
```

These are used by the MongoDB and MySQL icons in the UI.

## 9) Queries to View Data

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

## 10) Normal Run Order

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

## 11) Important Note About the Client API Constant

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
