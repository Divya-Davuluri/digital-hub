# Digital Marketing Hub SaaS

A production-ready full-stack SaaS platform built with Next.js, Node.js, Express, and Turso.

## 📁 Project Structure

```
/digital-marketing-hub
  /frontend          # Next.js 14 App Router, Tailwind CSS, TypeScript
  /backend           # Node.js, Express, TypeScript, Turso Client
  /database          # SQL Schema and Migration scripts
  /docs              # Project documentation
```

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Turso account (for SQLite edge database)

### 2. Environment Setup

Create `.env` files in both `frontend` and `backend` directories.

**Backend (`/backend/.env`):**
```env
PORT=5000
TURSO_DATABASE_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:5000
```

**Frontend (`/frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Database Setup
Run the SQL schema in your Turso database:
```bash
# Use turso CLI or web dashboard to execute database/schema.sql
```

### 4. Installation & Running

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Key Features
- **Authentication**: JWT-based login/signup + Google OAuth.
- **Security**: 2FA (TOTP) using Speakeasy and QR Codes.
- **Multi-client**: Users belong to Organizations with role-based access.
- **Dashboard**: Real-time analytics and campaign management.
- **CI/CD**: Automated build and test pipeline via GitHub Actions.

## 🎨 Design Tokens
- **Colors**: Primary (Indigo), Secondary (Purple), Background (Slate 900)
- **Spacing**: 4px base (4, 8, 16, 32)
- **Typography**: Inter (Modern sans-serif)
- **Shadows**: Custom elevation-low, mid, high
