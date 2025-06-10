const routes = require("./routes");

// --- User Feature Plugin ---

module.exports = {
  name: "users",
  version: "1.0.0",
  register: async (server, options) => {
    server.route(routes);
  },
};
