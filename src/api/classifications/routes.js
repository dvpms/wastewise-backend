const Joi = require("joi");
const {
  createClassificationHandler,
  getClassificationsHandler,
} = require("./handlers");

const routes = [
  {
    method: "POST",
    path: "/classifications",
    handler: createClassificationHandler,
    options: {
      auth: "wastewise_jwt", // Lindungi route ini, hanya user login yang bisa akses
      validate: {
        payload: Joi.object({
          category: Joi.string().required(),
          type: Joi.string().required(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/classifications",
    handler: getClassificationsHandler,
    options: {
      auth: "wastewise_jwt", // Lindungi route ini juga
    },
  },
  {
    method: "POST",
    path: "/classify",
    handler: classifyAndAddPointsHandler,
    options: {
      auth: "wastewise_jwt",
      payload: {
        output: "stream",
        parse: true,
        multipart: true, // Izinkan multipart/form-data
        maxBytes: 10 * 1024 * 1024, // Batas 10MB
      },
    },
  },
];

module.exports = routes;
