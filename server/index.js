'use strict';

const bootstrap = require('./bootstrap');
const config = require('./config');
const controllers = require('./controllers');
const register = require('./register');
const routes = require('./routes');
const services = require('./services');

module.exports = {
  bootstrap,
  config,
  // contentTypes,
  controllers,
  // destroy,
  // middlewares,
  // policies,
  register,
  routes,
  services,
};
