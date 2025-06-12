const prisma = require('../../lib/prisma');
const Boom = require('@hapi/boom');

// --- Handlers for Classification Routes ---

const createClassificationHandler = async (request, h) => {
  // --- Ambil ID user dari token & data dari payload ---
  const { id: userId } = request.auth.credentials;
  const { category, type } = request.payload;

  // --- Tentukan poin berdasarkan jenis sampah ---
  const pointsAwarded = type.toLowerCase() === 'organik' ? 5 : 10;

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

    return h.response({
      status: 'success',
      message: 'Classification added successfully',
      data: classification,
    }).code(201);
  } catch (error) {
    throw Boom.internal('Failed to add classification');
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
      createdAt: 'desc', // Urutkan dari yang terbaru
    },
  });

  return {
    status: 'success',
    data: {
      classifications,
    },
  };
};

module.exports = {
  createClassificationHandler,
  getClassificationsHandler,
};