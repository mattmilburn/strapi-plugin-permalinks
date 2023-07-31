import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import { Delimiter, PathLabel } from './styled';

const AncestorsPath = ( { hasError, path } ) => {
  return (
    <PathLabel hasError={ hasError }>
      { path.split( '/' ).map( ( part, i ) => (
        <Fragment key={ i }>
          { part }
          <Delimiter hasError={ hasError }>/</Delimiter>
        </Fragment>
      ) ) }
    </PathLabel>
  );
};

AncestorsPath.propTypes = {
  hasError: PropTypes.bool,
  path: PropTypes.string.isRequired,
};

export default AncestorsPath;
