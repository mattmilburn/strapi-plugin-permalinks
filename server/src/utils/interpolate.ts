const interpolate = (originalStr: string, data: any = {}): string => {
  let str = originalStr;

  Object.entries(data).forEach(([key, value]: [string, string]) => {
    str = str.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  // Replace any remaining values with an empty string.
  str = str.replace(new RegExp(`{(.*)}`, 'g'), '').trim();

  return str;
};

export default interpolate;
