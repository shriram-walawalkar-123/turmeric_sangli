# Turmeric Supply Chain - Admin Authentication Setup

This project now includes admin authentication with MongoDB database. Follow these steps to set up and run the application.

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (v4.4 or higher)
3. **npm** or **yarn**

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd turmeric-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make sure MongoDB is running on your system:
   - **Windows**: Start MongoDB service or run `mongod`
   - **macOS**: `brew services start mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

4. Create a `.env` file in the `turmeric-backend` directory with the following content:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/turmeric_sangli
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:3000`

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd turmeric-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## Admin Authentication

### Features Added:

1. **Admin Registration**: Create new admin accounts with username and password
2. **Admin Login**: Secure login with JWT tokens
3. **Protected Routes**: All application features are now protected behind admin authentication
4. **Session Management**: Persistent login sessions with automatic token refresh
5. **Logout Functionality**: Secure logout with token cleanup

### Database Schema:

The admin collection in MongoDB has the following structure:
```javascript
{
  username: String (required, unique, 3-50 characters),
  password: String (required, minimum 6 characters, hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints:

- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Login admin
- `GET /api/auth/me` - Get current admin info
- `POST /api/auth/logout` - Logout admin

### Security Features:

- Password hashing using bcryptjs
- JWT token authentication
- Password minimum length validation
- Username uniqueness validation
- Secure token storage in localStorage

## Usage

1. When you first visit the application, you'll see the admin login/registration form
2. Create a new admin account using the registration form
3. Login with your credentials
4. Once authenticated, you'll have access to all the supply chain management features
5. The header will show your admin username and a logout button
6. Your session will persist across browser refreshes

## Troubleshooting

1. **MongoDB Connection Error**: Make sure MongoDB is running and accessible
2. **Port Already in Use**: Change the PORT in the .env file if 3000 is occupied
3. **CORS Issues**: The backend is configured to allow all origins in development
4. **Token Expired**: Login again if your session expires (tokens are valid for 24 hours)

## Production Considerations

1. Change the JWT_SECRET to a strong, random string
2. Use environment variables for all sensitive configuration
3. Implement proper CORS policies
4. Add rate limiting for authentication endpoints
5. Use HTTPS in production
6. Consider implementing refresh tokens for better security
