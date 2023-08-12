import getPermalink from '../get-permalink';

describe('getPermalink', () => {
  it('should combine ancestors path and slug into a permalink', () => {
    const ancestorsPath = 'foo/bar';
    const slug = 'slug';
    const output1 = `${ancestorsPath}/${slug}`;
    const output2 = `${slug}`;
    const result1 = getPermalink(ancestorsPath, slug);
    const result2 = getPermalink(null, slug);

    expect(result1).toEqual(output1);
    expect(result2).toEqual(output2);
  });

  it('should enforce lowercase option', () => {
    const ancestorsPath = 'foo/bar';
    const slug = 'sLuG';
    const output1 = 'foo/bar/slug';
    const output2 = 'foo/bar/sLuG';
    const result1 = getPermalink(ancestorsPath, slug, true);
    const result2 = getPermalink(ancestorsPath, slug, false);

    expect(result1).toEqual(output1);
    expect(result2).toEqual(output2);
  });
});
