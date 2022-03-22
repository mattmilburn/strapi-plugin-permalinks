import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@strapi/design-system';

import { PATH_SEPARATOR, SLASH_SEPARATOR } from '../../constants';

const ListViewTableCell = ( {
  ancestorsPath,
  isOrphan,
  slug,
} ) => {
  return isOrphan ? (
    <Box
      background="danger100"
      hasRadius
      paddingTop={ 1 }
      paddingBottom={ 1 }
      paddingLeft={ 2 }
      paddingRight={ 2 }
      style={ { width: 'fit-content' } }
    >
      <Typography fontWeight="bold" textColor="danger700">
        { [ ancestorsPath, slug ].filter( i => i ).join( SLASH_SEPARATOR ) }
      </Typography>
    </Box>
  ) : (
    <>
      { ancestorsPath && (
        <Typography textColor="neutral600">
          { ancestorsPath.split( PATH_SEPARATOR ).join( SLASH_SEPARATOR ) }
          { SLASH_SEPARATOR }
        </Typography>
      ) }
      <Typography textColor="neutral600">{ slug }</Typography>
    </>
  );
};

ListViewTableCell.propTypes = {
  ancestorsPath: PropTypes.string,
  isOrphan: PropTypes.bool.isRequired,
  slug: PropTypes.string.isRequired,
};

export default ListViewTableCell;
