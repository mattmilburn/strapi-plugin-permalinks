import get from 'lodash/get';
import { type ListFieldLayout, type ListLayout } from '@strapi/content-manager/strapi-admin';

import { ListViewColumn } from '../components';
import { PLUGIN_ID, UID_PERMALINK_FIELD } from '../constants';
import { getPermalinkAncestors, getPermalinkSlug } from '../utils';

export interface FilterPermalinkColumnsProps {
  displayedHeaders: ListFieldLayout[];
  layout: ListLayout;
}

const filterPermalinkColumns = ({ displayedHeaders, layout }: FilterPermalinkColumnsProps) => {
  // For any columns that have permalink enabled, replace ~ with / in the value.
  const filteredHeaders = displayedHeaders.map((header) => {
    const isPermalink = get(header, ['fieldSchema', 'customField']) === UID_PERMALINK_FIELD;

    if (!isPermalink) {
      return header;
    }

    return {
      ...header,
      cellFormatter: (props: any) => {
        const value = props[header.name];
        const ancestorsPath = getPermalinkAncestors(value);
        const slug = getPermalinkSlug(value);

        // Check if this entity has been orphaned due to a broken parent connection.
        const targetRelationName = get(header, [
          'fieldSchema',
          'pluginOptions',
          PLUGIN_ID,
          'targetRelation',
        ]);
        const targetRelationValue = get(props, targetRelationName);
        const isOrphan = !!ancestorsPath && !targetRelationValue;

        return <ListViewColumn isOrphan={isOrphan} ancestorsPath={ancestorsPath} slug={slug} />;
      },
    };
  });

  return {
    displayedHeaders: filteredHeaders,
    layout,
  };
};

export default filterPermalinkColumns;
