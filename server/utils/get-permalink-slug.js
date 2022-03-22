'use strict';

const { PATH_SEPARATOR } = require( '../constants' );

const getPermalinkSlug = path => {
  return path ? path.split( PATH_SEPARATOR ).filter( i => i ).reverse()[ 0 ] : '';
};

module.exports = getPermalinkSlug;
