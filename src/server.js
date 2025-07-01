// src/server.js (Versi Debugging Minimalis)
"use strict";

const Hapi = require("@hapi/hapi");

const init = async () => {
  const server = Hapi.server({
    port: 5001,
    host: "0.0.0.0", // Pastikan terikat ke semua antarmuka jaringan
  });

  // Membuat satu rute tes yang sangat sederhana
  server.route({
    method: "GET",
    path: "/test",
    handler: (request, h) => {
      console.log(">>> /test route was hit successfully! <<<"); // Log jika rute diakses
      return { status: "success", message: "Hapi server is reachable!" };
    },
  });

  await server.start();
  console.log("Minimal server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
