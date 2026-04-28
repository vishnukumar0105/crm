# CRM App (React + MongoDB + Bootstrap 5 + jQuery)

This project includes:
- **client**: React app (Vite) with Bootstrap 5 UI and jQuery flash effect
- **server**: Express + MongoDB API for CRM contacts

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

## 2) Features
- Add contact
- List contacts
- Delete contact
- Contact status field (Lead/Customer/Inactive)

## 3) Tech Stack
- ReactJS
- MongoDB with Mongoose
- Bootstrap 5
- jQuery (latest) for UI flash notification
