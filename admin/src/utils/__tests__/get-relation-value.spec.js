import getRelationValue from '../get-relation-value';

describe('getRelationValue', () => {
  it('should return the data object from a hasOne relation prop', () => {
    const data = { parent: { id: 1 } };
    const output = { id: 1 };
    const result = getRelationValue(data, 'parent');

    expect(result).toEqual(output);
  });

  it('should return the first data object from a hasMany relation prop', () => {
    const data = {
      parents: [{ id: 1 }, { id: 2 }],
    };
    const output = { id: 1 };
    const result = getRelationValue(data, 'parents');

    expect(result).toEqual(output);
  });
});
