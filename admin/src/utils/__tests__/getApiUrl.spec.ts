/** @jest-environment jsdom */
/**
 * @TODO - Fix TS error with global `strapi` and `backendURL`.
 */
import getApiUrl from '../getApiUrl';

describe('getApiUrl', () => {
  beforeAll(async () => {
    global.window = {
      strapi: {
        backendURL: 'http://localhost:8000',
      },
    };
  });

  it("should return Strapi's backend URL", () => {
    const path = 'foo/bar';
    const output = `${window.strapi.backendURL}/${path}`;
    const result = getApiUrl(path);

    expect(result).toEqual(output);
  });
});
