import { type PermalinkConfig } from '../../config';
import parseUrl from '../parseUrl';

describe('parseUrl', () => {
  it('should do nothing if no `url` prop is set', () => {
    const config: PermalinkConfig = { uids: [] };
    const data: any = {};
    const result = parseUrl(config, data);

    expect(result).toBeNull();
  });

  it('should build a url from config settings', () => {
    const config: PermalinkConfig = { uids: [], url: 'https://www.example.com/{slug}' };
    const data: any = { slug: 'foobar' };
    const output = 'https://www.example.com/foobar';
    const result = parseUrl(config, data);

    expect(result).toEqual(output);
  });
});
