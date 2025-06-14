const prisma = require("../../lib/prisma");
const Boom = require("@hapi/boom");
const axios = require("axios");
const fs = require("fs");

// --- Handlers for Classification Routes ---

const classifyAndAddPointsHandler = async (request, h) => {
  const { image } = request.payload;
  const { id: userId } = request.auth.credentials;
  const mlApiUrl = "http://localhost:8080/klasifikasi-sampah"; // Komunikasi server-ke-server

  try {
    // 1. Buat FormData untuk dikirim ke ML API
    const formData = new FormData();
    formData.append("file", image._data, {
      filename: image.hapi.filename,
      contentType: image.hapi.headers["content-type"],
    });

    // 2. Panggil ML API dari backend
    const mlResponse = await axios.post(mlApiUrl, formData, {
      headers: formData.getHeaders(),
    });

    const mlResult = mlResponse.data;

    // 3. Tambahkan poin berdasarkan hasil ML
    const pointsAwarded = mlResult.Jenis.toLowerCase() === "organik" ? 5 : 10;

    await prisma.$transaction([
      prisma.classification.create({
        data: {
          category: mlResult.Kategori,
          type: mlResult.Jenis,
          points: pointsAwarded,
          userId: userId,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: pointsAwarded } },
      }),
    ]);

    // 4. Kembalikan hasil ML ke frontend
    return h.response(mlResult).code(200);
  } catch (error) {
    console.error("Classification error:", error);
    throw Boom.badGateway("Failed to classify image.");
  }
};

const createClassificationHandler = async (request, h) => {
  // --- Ambil ID user dari token & data dari payload ---
  const { id: userId } = request.auth.credentials;
  const { category, type } = request.payload;

  // --- Tentukan poin berdasarkan jenis sampah ---
  const pointsAwarded = type.toLowerCase() === "organik" ? 5 : 10;

  try {
    // --- Gunakan transaksi untuk memastikan kedua operasi berhasil ---
    const [classification] = await prisma.$transaction([
      // 1. Buat catatan klasifikasi baru
      prisma.classification.create({
        data: {
          category,
          type,
          points: pointsAwarded,
          userId, // Hubungkan dengan user yang login
        },
      }),
      // 2. Tambahkan poin ke user terkait
      prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: pointsAwarded,
          },
        },
      }),
    ]);

    return h
      .response({
        status: "success",
        message: "Classification added successfully",
        data: classification,
      })
      .code(201);
  } catch (error) {
    throw Boom.internal("Failed to add classification");
  }
};

const getClassificationsHandler = async (request, h) => {
  // --- Ambil ID user dari token ---
  const { id: userId } = request.auth.credentials;

  // --- Cari semua riwayat klasifikasi milik user tersebut ---
  const classifications = await prisma.classification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc", // Urutkan dari yang terbaru
    },
  });

  return {
    status: "success",
    data: {
      classifications,
    },
  };
};

module.exports = {
  createClassificationHandler,
  getClassificationsHandler,
  classifyAndAddPointsHandler,
};
