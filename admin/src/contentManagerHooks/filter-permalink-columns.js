import React from 'react';
import get from 'lodash/get';

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

        // Check if this entity has been orphaned due to a broken parent connection.
        const targetRelationName = get( header, [ 'fieldSchema', 'pluginOptions', pluginId, 'targetRelation' ] );
        const targetRelationValue = get( props, targetRelationName );
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
