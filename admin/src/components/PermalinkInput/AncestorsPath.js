import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import { Delimiter, PathLabel } from './styled';

const AncestorsPath = ({ hasError, path }) => {
  return (
    <PathLabel hasError={hasError}>
      {path.split('/').map((part, i) => (
        <Fragment
          key={
            /* eslint-disable-next-line react/no-array-index-key */
            `${part}-${i}`
          }
        >
          {part}
          <Delimiter hasError={hasError}>/</Delimiter>
        </Fragment>
      ))}
    </PathLabel>
  );
};

AncestorsPath.defaultProps = {
  hasError: false,
};

AncestorsPath.propTypes = {
  hasError: PropTypes.bool,
  path: PropTypes.string.isRequired,
};

export default AncestorsPath;
