import React from 'react';

import { PATH_REPLACE_REGEX } from '../constants';

const filterPermalinkFields = ( { displayedHeaders, layout } ) => {
  // Find any fields that have a permalink prop and apply the string replacement.
  const filteredHeaders = displayedHeaders.map( header => {
    if ( header.fieldSchema.permalink ) {
      return {
        ...header,
        cellFormatter: props => (
          <>{ props[ header.name ].replace( PATH_REPLACE_REGEX, '/' ) }</>
        ),
      };
    }

    return header;
  } );

  return {
    displayedHeaders: filteredHeaders,
    layout,
  };
}

export default filterPermalinkFields;
