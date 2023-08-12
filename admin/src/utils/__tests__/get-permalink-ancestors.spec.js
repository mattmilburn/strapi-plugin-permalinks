import getPermalinkAncestors from '../get-permalink-ancestors';

describe('getPermalinkAncestors', () => {
  it('should return the ancestor parts of a path', () => {
    const input = 'foo/bar/slug';
    const output = 'foo/bar';
    const result = getPermalinkAncestors(input);

    expect(result).toEqual(output);
  });
});
