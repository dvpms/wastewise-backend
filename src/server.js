require("dotenv").config();

const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");

// --- Import Plugin ---
const usersPlugin = require("./api/users");
const classificationsPlugin = require("./api/classifications");

const init = async () => {
  // --- Konfigurasi Server ---
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.NODE_ENV !== "production" ? "localhost" : "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"], // Nanti ini juga bisa kita buat dinamis
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  // --- Definisi Strategi Otentikasi ---
  server.auth.strategy("wastewise_jwt", "jwt", {
    keys: process.env.JWT_SECRET,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: 14400, // Token valid selama 4 jam
    },
    validate: (artifacts, request, h) => {
      // Untuk saat ini, kita anggap token selalu valid jika signature-nya benar
      return {
        isValid: true,
        credentials: {
          id: artifacts.decoded.payload.id,
          email: artifacts.decoded.payload.email,
        },
      };
    },
  });

  // --- Registrasi Plugin Internal (Fitur Aplikasi) ---
  await server.register([
    {
      plugin: usersPlugin,
    },
    {
      plugin: classificationsPlugin, 
    },
  ]);

  // --- Penanganan Routes (Endpoint) ---
  server.route({
    method: "GET",
    path: "/",
    handler: (request, h) => {
      return {
        status: "success",
        message: "Welcome to WasteWise API!",
      };
    },
  });

  // --- Menjalankan Server ---
  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

// --- Penanganan Error ---
process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
