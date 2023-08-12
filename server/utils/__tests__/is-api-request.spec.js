'use strict';

const isApiRequest = require('../is-api-request');

describe('isApiRequest', () => {
  it('should return `true` if route info type is `content-api`', () => {
    const ctx = {
      state: {
        route: {
          info: {
            type: 'content-api',
          },
        },
      },
    };
    const result = isApiRequest(ctx);

    expect(result).toBe(true);
  });

  it('should return `false` if route info type is not `content-api`', () => {
    const ctx = {
      state: {
        route: {
          info: {
            type: 'other-api',
          },
        },
      },
    };
    const result = isApiRequest(ctx);

    expect(result).toBe(false);
  });
});
