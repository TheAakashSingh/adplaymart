const { createMocks } = require('node-mocks-http');
const bcrypt = require('bcryptjs');

// Mock the database connection and models
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));

jest.mock('@/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn()
  },
  Package: {
    findOne: jest.fn()
  }
}));

// Import the handler after mocking
const handler = require('../src/app/api/auth/register/route');
const { User, Package } = require('@/models');

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        phone: '9999999999'
      }
    });

    // Mock user not existing
    User.findOne.mockResolvedValue(null);
    
    // Mock package finding
    Package.findOne.mockResolvedValue({
      _id: 'package_id',
      name: 'Basic',
      price: 500
    });

    // Mock user creation
    const mockUser = {
      _id: 'user_id',
      username: 'testuser',
      email: 'test@example.com',
      referralCode: 'TEST123',
      save: jest.fn().mockResolvedValue(true)
    };
    User.create.mockResolvedValue(mockUser);

    await handler.POST(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message).toBe('User registered successfully');
  });

  it('should return error if user already exists', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        phone: '9999999999'
      }
    });

    // Mock user existing
    User.findOne.mockResolvedValue({
      _id: 'existing_user_id',
      email: 'existing@example.com'
    });

    await handler.POST(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.message).toBe('User already exists with this email or username');
  });

  it('should return error for invalid input', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        username: '',
        email: 'invalid-email',
        password: '123', // too short
        phone: '123' // too short
      }
    });

    await handler.POST(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.message).toContain('validation');
  });
});

describe('/api/auth/login', () => {
  const loginHandler = require('../src/app/api/auth/login/route');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login user with valid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Mock user finding
    User.findOne.mockResolvedValue({
      _id: 'user_id',
      email: 'test@example.com',
      password: hashedPassword,
      isActive: true,
      role: 'user'
    });

    await loginHandler.POST(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
  });

  it('should return error for invalid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
    });

    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Mock user finding
    User.findOne.mockResolvedValue({
      _id: 'user_id',
      email: 'test@example.com',
      password: hashedPassword,
      isActive: true
    });

    await loginHandler.POST(req, res);

    expect(res._getStatusCode()).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid credentials');
  });

  it('should return error for inactive user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Mock inactive user
    User.findOne.mockResolvedValue({
      _id: 'user_id',
      email: 'test@example.com',
      password: hashedPassword,
      isActive: false
    });

    await loginHandler.POST(req, res);

    expect(res._getStatusCode()).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(false);
    expect(data.message).toBe('Account is deactivated');
  });
});
