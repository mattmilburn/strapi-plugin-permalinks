import getApiUrl from '../get-api-url';

describe('getApiUrl', () => {
  // eslint-disable-next-line no-unused-vars
  let strapi;

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
