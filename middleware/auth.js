const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;
    
    // Extract token from Authorization header or cookie
    const bearerToken = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({
        error: "No token provided. Authorization required."
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "blogifysecretkey"
    );
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token has expired"
      });
    }
    
    return res.status(401).json({
      error: "Invalid token"
    });
  }
};

module.exports = auth;