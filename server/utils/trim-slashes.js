'use strict';

const trimSlashes = str => str.replace( /^\/|\/$/g, '' );

module.exports = trimSlashes;
