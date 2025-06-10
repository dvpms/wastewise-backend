require("dotenv").config();

const Hapi = require("@hapi/hapi");

// --- Import Plugin ---
const usersPlugin = require("./api/users");

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

  // --- Registrasi Plugin ---
  await server.register([
    {
      plugin: usersPlugin,
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
