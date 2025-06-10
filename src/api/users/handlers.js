const prisma = require("../../lib/prisma");
const bcrypt = require("bcrypt");
const Boom = require("@hapi/boom");

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
  // --- Ambil data dari request ---
  const { email, password } = request.payload;

  // --- Cari user berdasarkan email ---
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Boom.unauthorized("Invalid email or password");
  }

  // --- Bandingkan password yang diinput dengan hash di database ---
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw Boom.unauthorized("Invalid email or password");
  }

  // TODO: Generate JWT di langkah selanjutnya

  return {
    status: "success",
    message: "Login successful",
    data: {
      // Untuk sementara, kita berikan token palsu
      token: "dummy-jwt-for-now-will-be-implemented-next",
    },
  };
};

// --- Ekspor handler ---
module.exports = {
  registerUserHandler,
  loginUserHandler,
};
