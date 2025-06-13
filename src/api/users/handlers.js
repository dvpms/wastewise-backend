const prisma = require("../../lib/prisma");
const bcrypt = require("bcrypt");
const Boom = require("@hapi/boom");
const jwt = require("jsonwebtoken");

// --- Handlers for User Routes ---

const registerUserHandler = async (request, h) => {
  // --- Ambil data dari request ---
  const { username, email, password } = request.payload;

  // --- Cek apakah email sudah terdaftar ---
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    // Gunakan Boom untuk error response yang standar
    throw Boom.conflict("Email already registered");
  }

  // --- Hash password ---
  const hashedPassword = await bcrypt.hash(password, 10);

  // --- Simpan user ke database ---
  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    // --- Hapus password dari object response ---
    delete user.password;

    return h
      .response({
        status: "success",
        message: "User registered successfully",
        data: user,
      })
      .code(201);
  } catch (error) {
    throw Boom.internal("Failed to register user");
  }
};

const loginUserHandler = async (request, h) => {
  // --- Ambil data dan cari user ---
  const { email, password } = request.payload;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Boom.unauthorized("Invalid email or password");
  }

  // --- Bandingkan password ---
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw Boom.unauthorized("Invalid email or password");
  }

  // --- Buat Payload untuk JWT ---
  const payload = {
    id: user.id,
    email: user.email,
  };

  // --- Buat JWT menggunakan kunci rahasia ---
  const token = jwt.sign(payload, process.env.JWT_SECRET);

  // --- Kembalikan token asli ---
  return {
    status: "success",
    message: "Login successful",
    data: {
      token,
    },
  };
};

const getUserProfileHandler = async (request, h) => {
  try {
    // Ambil ID user dari hasil validasi token
    const { id: userId } = request.auth.credentials;

    // Cari data user di database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        points: true,
      },
    });

    if (!user) {
      throw Boom.notFound("User not found");
    }

    return {
      status: "success",
      data: {
        user,
      },
    };
  } catch (error) {
    if (Boom.isBoom(error)) {
      throw error;
    }
    throw Boom.internal("Failed to get user profile");
  }
};

// --- Ekspor handler ---
module.exports = {
  registerUserHandler,
  loginUserHandler,
  getUserProfileHandler,
};
