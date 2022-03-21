import React from 'react';
import { Typography } from '@strapi/design-system';

import { PATH_SEPARATOR, SLASH_SEPARATOR } from '../constants';
import { getPermalinkAncestors, getPermalinkSlug, pluginId } from '../utils';

const filterPermalinkColumns = ( { displayedHeaders, layout }, pluginConfig ) => {
  const contentTypes = pluginConfig?.contentTypes ?? [];
  const { contentType: { uid } } = layout;

  // For any columns that have permalink enabled, replace ~ with / in the value.
  const filteredHeaders = displayedHeaders.map( header => {
    const supportedType = contentTypes.find( type => {
      return type.uid === uid && type.targetField === header.name;
    } );

    // Maybe provide custom cell formatter for this column.
    if ( !! supportedType ) {
      return {
        ...header,
        cellFormatter: props => {
          const value = props[ header.name ];
          const ancestorsPath = getPermalinkAncestors( value );
          const slug = getPermalinkSlug( value );

          // Check if this entity has been orphaned due to its parent being deleted.
          const { targetField, targetRelation } = supportedType;
          const isOrphan = ! props[ targetRelation ] && !! ancestorsPath;

          return (
            <>
              { ancestorsPath && (
                <Typography textColor={ isOrphan ? 'danger600': 'neutral600' }>
                  { ancestorsPath.split( PATH_SEPARATOR ).join( SLASH_SEPARATOR ) }
                  { SLASH_SEPARATOR }
                </Typography>
              ) }
              <Typography textColor={ isOrphan ? 'danger600': 'neutral600' }>
                { slug }
              </Typography>
            </>
          );
        },
      };
    }

    // Otherwise return the column config unchanged.
    return header;
  } );

  return {
    displayedHeaders: filteredHeaders,
    layout,
  };
}

export default filterPermalinkColumns;
