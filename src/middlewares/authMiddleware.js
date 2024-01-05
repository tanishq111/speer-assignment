const jwtUtils = require('../utils/jwtUtils');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  try {
    const decodedToken = jwtUtils.verifyToken(token.split(' ')[1]);
    req.decodedToken = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

module.exports = { authenticate };
