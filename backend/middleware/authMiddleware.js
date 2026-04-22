const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Get token from header (Frontend will send it here)
  const token = req.header('Authorization');

  // 2. Check if no token exists
  if (!token) {
    return res.status(401).json({ message: 'No token provided. Authorization denied.' });
  }

  try {
    // 3. The token usually comes as "Bearer <token_string>", so we split it
    const tokenString = token.split(' ')[1] || token;

    // 4. Verify token using your secret key
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);

    // 5. Add user payload from token to the request object
    req.user = decoded.user;
    
    // 6. Move to the next function (allow access to the route)
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid or has expired.' });
  }
};