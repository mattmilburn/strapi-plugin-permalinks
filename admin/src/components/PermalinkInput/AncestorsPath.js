import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';

import { More } from '@strapi/icons';
import { Delimiter, ExpandButton, HideButton, PathLabel } from './styled';

const AncestorsPath = ({ hasError, path }) => {
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return (
      <HideButton onClick={() => setExpanded(false)} label="Show ancestor path">
        <PathLabel hasError={hasError}>
          {path.split(/(?:\/|~)+/).map((part, i) => (
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
      </HideButton>
    );
  } else {
    return (
      <ExpandButton
        hasError={hasError}
        variant="secondary"
        label="Show ancestor path"
        onClick={() => setExpanded(true)}
      >
        <More />
      </ExpandButton>
    );
  }
};

AncestorsPath.defaultProps = {
  hasError: false,
};

AncestorsPath.propTypes = {
  hasError: PropTypes.bool,
  path: PropTypes.string.isRequired,
};

export default AncestorsPath;
