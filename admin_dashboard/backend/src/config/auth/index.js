const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const environment = require('../environment');

class AuthConfig {
  constructor() {
    this.jwtSecret = environment.JWT_SECRET;
    this.jwtExpiresIn = environment.JWT_EXPIRES_IN;
    this.bcryptRounds = environment.BCRYPT_ROUNDS;
  }

  // JWT Token Operations
  generateToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      algorithm: 'HS256'
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }

  // Password Operations
  async hashPassword(password) {
    return await bcrypt.hash(password, this.bcryptRounds);
  }

  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Token Extraction
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Role Validation
  validateRole(userRole, requiredRole) {
    const roleHierarchy = {
      'super_admin': 4,
      'admin': 3,
      'moderator': 2,
      'user': 1
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '30d',
      algorithm: 'HS256'
    });
  }

  // Session management
  createSessionData(user) {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: new Date()
    };
  }
}

module.exports = new AuthConfig();