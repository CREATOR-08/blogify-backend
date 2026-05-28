const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.token;
  const bearerToken = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "blogifysecretkey");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};

module.exports = auth;