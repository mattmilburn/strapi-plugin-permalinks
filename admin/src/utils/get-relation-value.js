const getRelationValue = ( data, key ) => {
  const value = data[ key ];

  if ( Array.isArray( value ) ) {
    return value[ 0 ];
  }

  return value ?? null;
};

export default getRelationValue;
