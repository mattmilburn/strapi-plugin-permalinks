const getRelationValue = (data: any, key: string): string | null => {
  const value = data[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? null;
};

export default getRelationValue;
