# Troubleshooting Login/Register Issues

## Common Issues and Solutions

### 1. Backend Server Not Running
**Problem**: Frontend cannot connect to backend API.

**Solution**: 
- Make sure the backend server is running on port 5000
- Run `npm run dev` in the `backend` folder
- Check that you see: "AnLink API Server Running" on port 5000

### 2. CORS Errors
**Problem**: Browser console shows CORS errors.

**Solution**: 
- The backend should have CORS enabled (it's already configured)
- Make sure the backend is running on `http://localhost:5000`
- Check browser console for specific CORS error messages

### 3. Password Requirements
**Problem**: Registration fails with password error.

**Solution**: 
- Password must be at least **8 characters** (not 6)
- Make sure password meets the requirements

### 4. Network Errors
**Problem**: "Network Error" or "Failed to fetch" in console.

**Solution**:
- Check if backend is running: Open `http://localhost:5000/api/health` in browser
- Check browser console (F12) for detailed error messages
- Verify API URL in `.env` file or check `frontend/src/services/api.js` (default: `http://localhost:5000/api`)

### 5. Error Messages Not Showing
**Problem**: Login/Register fails but no error message appears.

**Solution**:
- Open browser console (F12) to see detailed error messages
- Check Network tab to see the actual API response
- Error messages should now appear in red boxes on the form

## Testing the Connection

1. **Test Backend Health**:
   - Open browser and go to: `http://localhost:5000/api/health`
   - Should see JSON response with status: "running"

2. **Test API Endpoint**:
   - Open browser console (F12)
   - Try logging in/registering
   - Check Console tab for error messages
   - Check Network tab to see the API request/response

## Debug Steps

1. **Check Backend is Running**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check Frontend Console**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for error messages when trying to login/register

3. **Check Network Requests**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to login/register
   - Click on the `/api/auth/login` or `/api/auth/register` request
   - Check the Response tab to see what the server returned

4. **Verify API URL**:
   - Check `frontend/src/services/api.js`
   - Default is: `http://localhost:5000/api`
   - If backend runs on different port, create `.env` file in frontend:
     ```
     REACT_APP_API_URL=http://localhost:5000/api
     ```

## Common Error Messages

- **"Login failed"**: Check email/password, or backend connection
- **"Password must be at least 8 characters"**: Use longer password
- **"Email already registered"**: Use different email or login instead
- **"Invalid email or password"**: Check credentials
- **"Network Error"**: Backend server not running or wrong URL

