# Employee Management Membership App

This project has two parts:
- **client**: React/Vite UI with Bootstrap, Bootstrap Icons, and jQuery success messages.
- **server**: Express API that connects to MongoDB and stores data in real MongoDB collections.

This version does **not** use browser `localStorage` and does **not** write to a local JSON file.

## MongoDB Collections

The API uses this MongoDB database:

```text
Subscription
```

The API stores and reads these collections:

```text
UserDetails
MembershipPlans
```

- `MembershipPlans` stores the Free, Silver, and Gold plan definitions.
- `UserDetails` stores the users who activate a membership.
- Every user document keeps a reference to the selected membership plan through `membershipPlan`.

## Backend Setup

Create `server/.env` from the example file:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Put your MongoDB settings in `server/.env`:

```env
PORT=5000
MONGODB_SERVER=192.168.10.218:27017
MONGODB_DATABASE=Subscription
MONGODB_USERNAME=dev
MONGODB_PASSWORD="your_mongodb_password_here"
MONGODB_AUTH_SOURCE=admin
```

The separate fields are recommended because passwords with special characters like `#`, `$`, and `@` do not need manual URL encoding. Keep the password in quotes because `#` can be treated as a comment in `.env` files. The server builds the MongoDB connection string safely.

Successful server output should look like:

```text
Server running on http://localhost:5000
MongoDB connected: Subscription
User collection: UserDetails
Membership plan collection: MembershipPlans
```

## Frontend Setup

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

```js
http://localhost:5000
```

If your backend API is deployed on another URL, create `client/.env`:

```env
VITE_API_BASE_URL=https://your-live-api-domain.com
```

## API Endpoints

### Health Check

```http
GET /api/health
```

Returns the connected database name and collection names.

### Get Membership Plans

```http
GET /api/membership-plans
```

Reads Free, Silver, and Gold plans from the MongoDB `MembershipPlans` collection.

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

Both endpoints read from the MongoDB `UserDetails` collection and populate the membership plan reference.

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

## MongoDB Queries to View Data

Use MongoDB Compass or MongoDB shell.

```js
const database = db.getSiblingDB('Subscription');

database.MembershipPlans.find().pretty();

database.UserDetails.find().pretty();

database.UserDetails.find({ status: 'active' }).sort({ updatedAt: -1 });
```

## Important Note About the Client API Constant

This is not a dummy database:

```js
const MEMBERS_API = `${API_BASE_URL}/api/memberships`;
```

That line is only the frontend API URL. The browser sends form data to the Express server at `/api/memberships`, and the server saves it dynamically into MongoDB collection `UserDetails`.

## Normal Run Order

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
5. Click the admin icon to see `UserDetails` and `MembershipPlans` data in the UI.
6. Open MongoDB Compass to see the same data in the live MongoDB database.

## Tech Stack

- ReactJS
- Express
- MongoDB with Mongoose
- Bootstrap 5
- Bootstrap Icons
- jQuery
