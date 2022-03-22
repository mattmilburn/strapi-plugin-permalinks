import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import { PATH_SEPARATOR, SLASH_SEPARATOR } from '../../constants';
import { Delimiter, PathLabel } from './styled';

const AncestorsPath = ( { hasError, path } ) => {
  return (
    <PathLabel hasError={ hasError }>
      { path.split( PATH_SEPARATOR ).map( ( part, i ) => (
        <Fragment key={ i }>
          { part }
          <Delimiter hasError={ hasError }>{ SLASH_SEPARATOR }</Delimiter>
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
