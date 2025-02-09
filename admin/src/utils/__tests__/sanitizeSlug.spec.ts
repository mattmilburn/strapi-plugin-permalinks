/** @jest-environment jsdom */
import sanitizeSlug from '../sanitizeSlug';

describe('sanitizeSlug', () => {
  it('should remove illegal characters from slugs', () => {
    const input = '"foo"bar"';
    const output = 'foobar';
    const result = sanitizeSlug(input);

    expect(result).toEqual(output);
  });

  it('should allow certain characters in slugs', () => {
    const input = ' foobar"-_.~!$&\'()*+,;=:@%/" ';
    const output = "foobar-_.~!$&'()*+,;=:@%";
    const result = sanitizeSlug(input);

    expect(result).toEqual(output);
  });
});
