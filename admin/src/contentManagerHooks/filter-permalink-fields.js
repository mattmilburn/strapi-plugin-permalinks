import React from 'react';
import { Typography } from '@strapi/design-system';

import { PATH_DELIMITER } from '../constants';

const filterPermalinkFields = ( { displayedHeaders, layout } ) => {
  // Find any fields that have a permalink prop and apply the string replacement.
  const filteredHeaders = displayedHeaders.map( header => {
    if ( header.fieldSchema.permalink ) {
      return {
        ...header,
        cellFormatter: props => {
          const value = props[ header.name ];
          const parts = value.split( PATH_DELIMITER );
          const len = parts.length - 1;

          return (
            <>
              { !! len && <Typography textColor="neutral600">{ parts.slice( 0, len ).join( '/' ) }/</Typography> }
              <Typography textColor="neutral800">{ parts[ len ] }</Typography>
            </>
          );
        },
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
