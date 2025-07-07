const prisma = require("../../lib/prisma");
const FormData = require("form-data");
const Boom = require("@hapi/boom");
const axios = require("axios");

// --- Handlers for Classification Routes ---

const classifyAndAddPointsHandler = async (request, h) => {
  const imagePayload = request.payload.image;
  const { id: userId } = request.auth.credentials;
  const mlApiUrl = process.env.ML_API_URL;
  if (!imagePayload) {
    throw Boom.badRequest("Invalid image payload received.");
  }

  try {
    const formData = new FormData();
    // 'imagePayload' sekarang adalah buffer, kita langsung append
    formData.append("file", imagePayload, {
      filename: "upload.jpg", // Nama file tidak terlalu penting di sini
      contentType: "image/jpeg", // Kita bisa asumsikan tipenya
    });

    const mlResponse = await axios.post(mlApiUrl, formData, {
      headers: formData.getHeaders(),
    });

    const mlResult = mlResponse.data;
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

    return h.response(mlResult).code(200);
  } catch (error) {
    console.error("Classification error:", error);
    if (error.response) {
      console.error("Error data:", error.response.data);
      console.error("Error status:", error.response.status);
    }
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
          userId,
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
        pointsAwarded,
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
