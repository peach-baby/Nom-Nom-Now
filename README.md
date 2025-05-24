# Nom Nom Now - Food Ordering Platform

A full-stack food ordering platform that allows restaurant owners to manage their restaurants and customers to place orders.

## Features

- User authentication (local and Google OAuth)
- Role-based access (Customer and Restaurant Owner)
- Restaurant management
  - Create and edit restaurant profiles
  - Manage menu items
  - View and update order status
- Customer features
  - Browse restaurants
  - Place orders
  - View order history
  - Leave reviews
- Real-time order tracking
- Secure payment processing

## Tech Stack

- Backend:
  - Node.js
  - Express.js
  - MongoDB
  - JWT Authentication
  - Passport.js (Google OAuth)
- Frontend (to be implemented):
  - React.js
  - Redux
  - Material-UI
  - Axios

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google OAuth credentials (for Google login)

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nom-nom-now
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/nom-nom-now
   JWT_SECRET=your-jwt-secret-key
   SESSION_SECRET=your-session-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/google` - Google OAuth login
- GET `/api/auth/google/callback` - Google OAuth callback

### Restaurants
- GET `/api/restaurants` - Get all restaurants
- GET `/api/restaurants/:id` - Get single restaurant
- POST `/api/restaurants` - Create restaurant (owner only)
- PUT `/api/restaurants/:id` - Update restaurant (owner only)
- POST `/api/restaurants/:id/menu` - Add menu item (owner only)
- PUT `/api/restaurants/:id/menu/:itemId` - Update menu item (owner only)
- DELETE `/api/restaurants/:id/menu/:itemId` - Delete menu item (owner only)
- POST `/api/restaurants/:id/reviews` - Add review (customers only)

### Orders
- GET `/api/orders/customer` - Get customer orders
- GET `/api/orders/restaurant` - Get restaurant orders (owner only)
- POST `/api/orders` - Create new order (customers only)
- PATCH `/api/orders/:id/status` - Update order status (owner only)
- PATCH `/api/orders/:id/cancel` - Cancel order (customers only)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 