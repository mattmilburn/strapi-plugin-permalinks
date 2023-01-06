import React from 'react';
import { Typography } from '@strapi/design-system/Typography';

import { ListViewTableCell  } from '../components';
import { getPermalinkAncestors, getPermalinkSlug, pluginId } from '../utils';

const filterPermalinkColumns = ( { displayedHeaders, layout } ) => {
  // For any columns that have permalink enabled, replace ~ with / in the value.
  const filteredHeaders = displayedHeaders.map( header => {
    const isPermalink = header.fieldSchema.customField === 'plugin::permalinks.permalink';

    if ( ! isPermalink ) {
      return header;
    }

    return {
      ...header,
      cellFormatter: props => {
        const value = props[ header.name ];
        const ancestorsPath = getPermalinkAncestors( value );
        const slug = getPermalinkSlug( value );

        // Check if this entity has been orphaned due to its parent being deleted.
        const targetRelationValue = props[ header.fieldSchema.targetRelation ];
        const isOrphan = !! ancestorsPath && ! targetRelationValue;

        return (
          <ListViewTableCell
            isOrphan={ isOrphan }
            ancestorsPath={ ancestorsPath }
            slug={ slug }
          />
        );
      },
    };
  } );

  return {
    displayedHeaders: filteredHeaders,
    layout,
  };
}

export default filterPermalinkColumns;
