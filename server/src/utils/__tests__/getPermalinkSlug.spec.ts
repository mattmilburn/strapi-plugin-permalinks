import getPermalinkSlug from '../getPermalinkSlug';

describe('getPermalinkSlug', () => {
  it('should return the slug part of a path', () => {
    const input = 'foo/bar/slug';
    const output = 'slug';
    const result = getPermalinkSlug(input);

    expect(result).toEqual(output);
  });
});
