import React from 'react';
import { Typography } from '@strapi/design-system';

import { PATH_SEPARATOR, SLASH_SEPARATOR } from '../constants';
import { getPermalinkAncestors, getPermalinkSlug } from '../utils';

const filterPermalinkColumns = ( { displayedHeaders, layout } ) => {
  // Find any columns that have a permalink flag and apply the string replacement.
  const filteredHeaders = displayedHeaders.map( header => {
    if ( header.fieldSchema.permalink ) {
      return {
        ...header,
        cellFormatter: props => {
          const value = props[ header.name ];
          const ancestorsPath = getPermalinkAncestors( value );
          const slug = getPermalinkSlug( value );

          return (
            <>
              { ancestorsPath && (
                <Typography textColor="neutral600">
                  { ancestorsPath.split( PATH_SEPARATOR ).join( SLASH_SEPARATOR ) }
                  { SLASH_SEPARATOR }
                </Typography>
              ) }
              <Typography textColor="neutral800">{ slug }</Typography>
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

export default filterPermalinkColumns;
