'use strict';

const parseUrl = require('../parse-url');

describe('parseUrl', () => {
  it('should do nothing if no `url` prop is set', () => {
    const config = {};
    const data = {};
    const result = parseUrl(config, data);

    expect(result).toBeNull();
  });

  it('should build a url from config settings', () => {
    const config = { url: 'https://www.example.com/{slug}' };
    const data = { slug: 'foobar' };
    const output = 'https://www.example.com/foobar';
    const result = parseUrl(config, data);

    expect(result).toEqual(output);
  });
});
