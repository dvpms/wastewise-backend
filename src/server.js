// src/server.js (Versi Debugging Lengkap)
"use strict";

require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");

// Impor Plugin
const usersPlugin = require("./api/users");
const classificationsPlugin = require("./api/classifications");

const init = async () => {
  console.log("Server initialization started...");

  const server = Hapi.server({
    port: process.env.PORT || 5001,
    host: process.env.NODE_ENV !== "production" ? "localhost" : "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });
  console.log("Hapi server configured.");

  // Registrasi Plugin Eksternal
  await server.register([{ plugin: Jwt }]);
  console.log("JWT plugin registered.");

  // Definisi Strategi Otentikasi
  server.auth.strategy("wastewise_jwt", "jwt", {
    keys: process.env.JWT_SECRET,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: 14400,
    },
    validate: (artifacts, request, h) => {
      return {
        isValid: true,
        credentials: {
          id: artifacts.decoded.payload.id,
          email: artifacts.decoded.payload.email,
        },
      };
    },
  });
  console.log("JWT auth strategy defined.");

  // Registrasi Plugin Internal
  await server.register([
    { plugin: usersPlugin },
    { plugin: classificationsPlugin },
  ]);
  console.log("Application plugins registered.");

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on("unhandledRejection", (err) => {
  console.log("FATAL ERROR (unhandledRejection):", err);
  process.exit(1);
});

init();
