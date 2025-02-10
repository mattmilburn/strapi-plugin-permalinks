const isConnecting = (data: any, key: string): boolean => {
  const prop = data[key];

  return !!(prop && prop.connect && !!prop.connect.length);
};

export default isConnecting;
