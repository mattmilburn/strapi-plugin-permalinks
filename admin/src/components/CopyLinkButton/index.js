import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Button } from '@strapi/design-system';
import { useNotification } from '@strapi/helper-plugin';
import { Link as LinkIcon } from '@strapi/icons';

import { getTrad } from '../../utils';

const CopyLinkButton = ({ url }) => {
  const { formatMessage } = useIntl();
  const toggleNotification = useNotification();

  const handleOnCopy = useCallback(() => {
    toggleNotification({
      type: 'success',
      message: {
        id: getTrad('notification.success.permalink-copied'),
        defaultMessage: 'Permalink copied to the clipboard',
      },
    });
  }, [toggleNotification]);

  return (
    <CopyToClipboard text={url} onCopy={handleOnCopy}>
      <Button size="S" startIcon={<LinkIcon />} variant="secondary" style={{ width: '100%' }}>
        {formatMessage({
          id: getTrad('form.button.copy-permalink'),
          defaultMessage: 'Copy permalink',
        })}
      </Button>
    </CopyToClipboard>
  );
};

CopyLinkButton.propTypes = {
  url: PropTypes.string.isRequired,
};

export default memo(CopyLinkButton);
