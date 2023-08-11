import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@strapi/design-system/Box';
import { Typography } from '@strapi/design-system/Typography';

const ListViewTableCell = ({ ancestorsPath, isOrphan, slug }) => {
  return isOrphan ? (
    <Box
      background="danger100"
      hasRadius
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      style={{ width: 'fit-content' }}
    >
      <Typography fontWeight="bold" textColor="danger700">
        {[ancestorsPath, slug].filter((i) => i).join('/')}
      </Typography>
    </Box>
  ) : (
    <>
      {ancestorsPath && <Typography textColor="neutral600">{ancestorsPath}/</Typography>}
      <Typography textColor="neutral600">{slug}</Typography>
    </>
  );
};

ListViewTableCell.defaultProps = {
  ancestorsPath: null,
};

ListViewTableCell.propTypes = {
  ancestorsPath: PropTypes.string,
  isOrphan: PropTypes.bool.isRequired,
  slug: PropTypes.string.isRequired,
};

export default ListViewTableCell;
