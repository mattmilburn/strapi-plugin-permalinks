'use strict';

const isConnecting = require('../is-connecting');

describe('isConnecting', () => {
  it('should return `true` if target relation is connecting', () => {
    const name = 'prop';
    const data = {
      [name]: {
        disconnect: [],
        connect: [{ id: 1 }],
      },
    };
    const result = isConnecting(data, name);

    expect(result).toBe(true);
  });

  it('should return `false` if target relation is not connecting', () => {
    const name = 'prop';
    const data = {
      [name]: {
        disconnect: [],
        connect: [],
      },
    };
    const result = isConnecting(data, name);

    expect(result).toBe(false);
  });
});
