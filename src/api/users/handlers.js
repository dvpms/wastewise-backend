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

const updateUserProfileHandler = async (request, h) => {
  const { id: userId } = request.auth.credentials;
  const { username, password } = request.payload;
  const dataToUpdate = {};

  // Cek jika ada username baru, tambahkan ke data yang akan diupdate
  if (username) {
    dataToUpdate.username = username;
  }

  // Cek jika ada password baru, hash terlebih dahulu
  if (password) {
    dataToUpdate.password = await bcrypt.hash(password, 10);
  }

  // Jika tidak ada data untuk diupdate, kembalikan error
  if (Object.keys(dataToUpdate).length === 0) {
    throw Boom.badRequest("No data provided for update");
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { id: true, email: true, username: true, points: true }, // Kirim kembali data yang aman
    });

    return {
      status: "success",
      message: "Profile updated successfully",
      data: { user: updatedUser },
    };
  } catch (error) {
    throw Boom.internal("Failed to update profile");
  }
};

const getLeaderboardHandler = async (request, h) => {
  try {
    const users = await prisma.user.findMany({
      // Urutkan pengguna berdasarkan poin, dari yang tertinggi ke terendah
      orderBy: {
        points: 'desc',
      },
      // Ambil hanya 10 pengguna teratas
      take: 10,
      // Pilih hanya data yang aman untuk ditampilkan publik
      select: {
        username: true,
        points: true,
      },
    });

    return {
      status: 'success',
      data: {
        users,
      },
    };
  } catch (error) {
    throw Boom.internal('Failed to get leaderboard');
  }
};


// --- Ekspor handler ---
module.exports = {
  registerUserHandler,
  loginUserHandler,
  getUserProfileHandler,
  updateUserProfileHandler,
  getLeaderboardHandler
};
