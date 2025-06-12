const routes = require("./routes");

module.exports = {
  name: "classifications",
  register: async (server) => {
    server.route(routes);
  },
};
