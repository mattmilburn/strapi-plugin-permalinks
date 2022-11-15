const getRelationValue = ( data, key ) => {
  const value = data[ key ];

  if ( ! value || ! value.length ) {
    return null;
  }

  if ( Array.isArray( value ) ) {
    return value[ 0 ];
  }

  return value;
};

export default getRelationValue;
