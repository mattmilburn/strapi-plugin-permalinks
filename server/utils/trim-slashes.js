'use strict';

const trimSlashes = (str) => str.replace(/^\/|\/$/g, '').trim();

module.exports = trimSlashes;
