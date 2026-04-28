# Architecture Overview

## Monorepo Strategy
This project uses a clean directory-based monorepo structure to separate concerns while keeping the codebase manageable.

### Frontend (Next.js)
- **App Router**: Uses the latest Next.js 14 conventions.
- **Atomic Components**: Reusable components in `src/components`.
- **Design System**: Centralized tokens in Tailwind configuration for consistent branding.

### Backend (Express)
- **MVC Pattern**:
  - `controllers/`: Business logic.
  - `routes/`: Endpoint definitions.
  - `models/`: Data schemas (Mongoose).
  - `middleware/`: Auth and validation logic.

### Database
- **Mongoose**: Provides an elegant way to model data for MongoDB.
- **Config**: Centralized connection logic in `/database/config.js`.

### Deployment
- **CI/CD**: GitHub Actions automates builds and basic testing to ensure main branch stability.
