# Stock Watchlist Application

## Overview

This is a full-stack stock watchlist application that allows users to track and monitor their favorite stocks in real-time. The application provides an intuitive interface for adding stocks to a watchlist, viewing current prices and performance metrics, and analyzing stock trends across different time periods. Built with a modern React frontend and Express.js backend, it integrates with financial APIs to provide accurate, up-to-date stock market data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built with React 18 using TypeScript and follows a component-based architecture. The UI leverages shadcn/ui components built on Radix UI primitives for a consistent, accessible design system. Key architectural decisions include:

- **State Management**: Uses TanStack Query (React Query) for server state management, providing automatic caching, background updates, and optimistic updates
- **Styling**: Tailwind CSS with a custom design system using CSS variables for theming, allowing for easy customization and dark/light mode support
- **Routing**: Wouter for lightweight client-side routing with minimal bundle impact
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Component Structure**: Modular component architecture with clear separation between UI components, business logic, and data fetching

### Backend Architecture
The server follows a RESTful API design built with Express.js and TypeScript:

- **Database Layer**: Drizzle ORM for type-safe database operations with PostgreSQL, providing compile-time query validation and excellent TypeScript integration
- **Data Storage**: Dual storage approach with an in-memory storage class for development/testing and PostgreSQL for production
- **API Design**: Clean REST endpoints with consistent error handling and response formatting
- **Stock Data Integration**: Python service integration using yfinance library for real-time stock data fetching
- **Validation**: Zod schemas shared between client and server for consistent data validation

### Data Storage Solutions
The application uses a flexible storage architecture:

- **Primary Database**: PostgreSQL with Drizzle ORM for production data persistence
- **Development Storage**: In-memory storage implementation for rapid development and testing
- **Schema Design**: Two main tables - stocks for watchlist items and stock_data for historical price information
- **Data Relationships**: Foreign key relationships with cascade deletes to maintain data integrity

### Authentication and Authorization
Currently implements a session-based approach with plans for user-specific watchlists:

- **Session Management**: Express sessions with PostgreSQL session store
- **Future Enhancement**: User authentication system to support multiple users with individual watchlists

## External Dependencies

### Third-party Services
- **Financial Data**: Yahoo Finance API through yfinance Python library for real-time stock quotes and historical data
- **Database**: Neon Database (serverless PostgreSQL) for cloud-based data storage
- **WebSocket Support**: Neon serverless with WebSocket constructor for real-time database connections

### APIs and Integrations
- **Stock Market Data**: Yahoo Finance provides current prices, historical data, and company information
- **Data Validation**: Real-time stock symbol validation and company name resolution
- **Chart Data**: Historical price data for multiple time periods (1D, 1W, 1M, 6M)

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Database Migrations**: Drizzle Kit for schema migrations and database management
- **Code Quality**: TypeScript for type safety across the entire stack
- **UI Components**: Radix UI primitives with shadcn/ui for accessible, customizable components