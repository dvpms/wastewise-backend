const Joi = require("joi");
const {
  registerUserHandler,
  loginUserHandler,
  getUserProfileHandler,
} = require("./handlers");

// --- Routes for User Feature ---

const routes = [
  {
    method: "POST",
    path: "/register",
    handler: registerUserHandler,
    options: {
      validate: {
        payload: Joi.object({
          username: Joi.string().min(3).required(),
          email: Joi.string().email().required(),
          password: Joi.string().min(6).required(),
        }),
      },
    },
  },
  {
    method: "POST",
    path: "/login",
    handler: loginUserHandler,
    options: {
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().required(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/profile",
    handler: getUserProfileHandler,
    options: {
      auth: "wastewise_jwt", // <-- Melindungi route ini
    },
  },
];

module.exports = routes;
