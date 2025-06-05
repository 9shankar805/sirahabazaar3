# Siraha Bazaar - Multi-Vendor E-commerce Platform

A comprehensive e-commerce marketplace built with React, Node.js, and PostgreSQL.

## Features

- **Multi-vendor marketplace** - Multiple stores can sell products
- **Product catalog** - Browse products by categories and stores
- **Shopping cart & wishlist** - Save items for later purchase
- **Order management** - Track orders from placement to delivery
- **Store locator** - Find nearby stores with map integration
- **User authentication** - Secure login and registration
- **Responsive design** - Works on desktop and mobile devices
- **Admin dashboard** - Manage products, orders, and analytics

## Quick Start for VS Code

### Prerequisites

1. **Node.js** (version 18 or higher) - Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL** - Download from [postgresql.org](https://www.postgresql.org/download/)
3. **VS Code** - Download from [code.visualstudio.com](https://code.visualstudio.com/)

### Setup Steps

1. **Clone or download** this project to your computer
2. **Open the project folder** in VS Code
3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Setup database**:
   - Create a new PostgreSQL database
   - Copy `.env.example` to `.env`
   - Update the DATABASE_URL in `.env` with your database connection string:
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
     ```

5. **Initialize database tables**:
   ```bash
   npm run db:push
   ```

6. **Start the application**:
   ```bash
   npm run dev
   ```

7. **Open your browser** and visit `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open database management interface

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   └── pages/          # Application pages
├── server/                 # Node.js backend
│   ├── routes.ts           # API endpoints
│   └── storage.ts          # Database operations
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
└── package.json            # Dependencies and scripts
```

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Wouter (routing)
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI primitives
- **Maps**: Leaflet for store locations
- **Forms**: React Hook Form with Zod validation

## Default Login

For testing purposes, you can create an admin account or use the registration form to create a customer account.

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your DATABASE_URL in the `.env` file
- Verify database credentials and database name

### Port Already in Use
- The app runs on port 5000 by default
- If port 5000 is busy, you can change it in the server configuration

### Dependencies Issues
- Try deleting `node_modules` and running `npm install` again
- Ensure you're using Node.js version 18 or higher

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all prerequisites are installed correctly
3. Ensure your database is running and accessible
4. Review the environment variables in your `.env` file

---

Built with ❤️ for local businesses in Nepal