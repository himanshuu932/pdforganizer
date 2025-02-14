const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    // Expecting format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    jwt.verify(token, '1234', (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = authenticateJWT;
