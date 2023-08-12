import getPermalinkSlug from '../get-permalink-slug';

describe('getPermalinkSlug', () => {
  it('should return the slug part of a path', () => {
    const input = 'foo/bar/slug';
    const output = 'slug';
    const result = getPermalinkSlug(input);

    expect(result).toEqual(output);
  });
});
