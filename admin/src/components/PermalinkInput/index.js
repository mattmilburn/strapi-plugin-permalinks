import React, { forwardRef, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import get from 'lodash/get';
import { TextInput } from '@strapi/design-system/TextInput';
import { Typography } from '@strapi/design-system/Typography';
import { useCMEditViewDataManager, useFetchClient, useNotification } from '@strapi/helper-plugin';
import CheckCircle from '@strapi/icons/CheckCircle';
import ExclamationMarkCircle from '@strapi/icons/ExclamationMarkCircle';
import Loader from '@strapi/icons/Loader';
import Refresh from '@strapi/icons/Refresh';

import { URI_COMPONENT_REGEX } from '../../constants';
import { useDebounce, usePluginConfig } from '../../hooks';
import {
  getApiUrl,
  getPermalink,
  getPermalinkAncestors,
  getPermalinkSlug,
  getRelationValue,
  getTrad,
  pluginId,
  sanitizeSlug,
} from '../../utils';

import AncestorsPath from './AncestorsPath';
import {
  EndActionWrapper,
  FieldActionWrapper,
  LoadingWrapper,
  RelativeInputWrapper,
  TextValidation,
} from './styled';

/**
 * @TODO - Refactor this component to NOT rely on disabling the eslint rule for
 * react-hooks/exhaustive-deps.
 */

const PermalinkInput = forwardRef((props, ref) => {
  const {
    contentTypeUID,
    disabled,
    error,
    hint,
    intlLabel,
    labelAction,
    name,
    onChange,
    placeholder,
    required,
    value,
  } = props;

  const fetchClient = useFetchClient();
  const { formatMessage } = useIntl();
  const toggleNotification = useNotification();
  const { initialData, isCreatingEntry, layout, modifiedData } = useCMEditViewDataManager();
  const { data: config } = usePluginConfig();
  const generateUID = useRef();

  const lowercase = get(config, 'lowercase', true);
  const targetFieldConfig = get(config, ['layouts', contentTypeUID], {});
  const targetRelationUID = get(
    layout,
    ['attributes', targetFieldConfig.targetRelation, 'targetModel'],
    null
  );
  const targetRelationValue = getRelationValue(modifiedData, targetFieldConfig.targetRelation);

  const hasDifferentRelationUID = targetRelationUID && contentTypeUID !== targetRelationUID;
  const selectedSelfRelation =
    !isCreatingEntry && !hasDifferentRelationUID && targetRelationValue?.id === modifiedData.id;

  const initialValue = initialData[name];
  const locale = initialData.locale;
  const initialRelationValue = getRelationValue(initialData, targetFieldConfig.targetRelation);
  const initialAncestorsPath = getPermalinkAncestors(initialValue);
  const initialSlug = getPermalinkSlug(initialValue);
  const debouncedValue = useDebounce(value, 300);
  const debouncedTargetValue = useDebounce(modifiedData[targetFieldConfig.targetField], 300);

  const [isLoading, setIsLoading] = useState(false);
  const [isOrphan, setIsOrphan] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [ancestorID, setAncestorID] = useState(null);
  const [isCustomized, setIsCustomized] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [regenerateLabel, setRegenerateLabel] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [ancestorsPath, setAncestorsPath] = useState(initialAncestorsPath);
  const [slug, setSlug] = useState(initialSlug);

  const label = intlLabel.id
    ? formatMessage(
        { id: intlLabel.id, defaultMessage: intlLabel.defaultMessage },
        { ...intlLabel.values }
      )
    : name;

  const formattedPlaceholder = placeholder
    ? formatMessage(
        { id: placeholder.id, defaultMessage: placeholder.defaultMessage },
        { ...placeholder.values }
      )
    : '';

  const formattedError = error ? formatMessage({ id: error, defaultMessage: error }) : undefined;

  const setFieldState = (
    newAncestorsPath,
    newSlug,
    shouldSetInitialValue = false,
    shouldRemoveErrors = true
  ) => {
    // Maybe remove errors.
    if (shouldRemoveErrors) {
      setFieldError(null);
    }

    // Update field state.
    setAncestorsPath(newAncestorsPath);
    setSlug(newSlug);

    // Update field value with ancestors path included.
    onChange(
      {
        target: {
          name,
          value: getPermalink(newAncestorsPath, newSlug, lowercase),
          type: 'text',
        },
      },
      shouldSetInitialValue
    );
  };

  const checkAvailability = async () => {
    if (!value || selectedSelfRelation) {
      return;
    }

    setIsLoading(true);

    try {
      const newSlug = getPermalink(isOrphan ? null : ancestorsPath, slug, lowercase);

      if (!newSlug) {
        setIsLoading(false);

        return;
      }

      const params = `${contentTypeUID}/${encodeURIComponent(newSlug)}${
        locale ? `/${locale}` : ''
      }`;

      const endpoint = getApiUrl(`${pluginId}/check-availability/${params}`);

      const { data } = await fetchClient.get(endpoint);

      setAvailability(data);
      setIsLoading(false);
    } catch (err) {
      toggleNotification({
        type: 'warning',
        message:
          err?.response?.data?.error?.message ??
          formatMessage({
            id: getTrad('notification.error'),
            defaultMessage: 'An error occurred',
          }),
      });

      setIsLoading(false);

      console.error(err);
    }
  };

  const checkConnection = async () => {
    if (!value || isCreatingEntry) {
      return;
    }

    try {
      const params = `${contentTypeUID}/${modifiedData.id}`;
      const endpoint = getApiUrl(`${pluginId}/check-connection/${params}`);

      const {
        data: { path: connectedAncestorsPath },
      } = await fetchClient.get(endpoint);

      if (ancestorsPath && !connectedAncestorsPath) {
        // This entity must be an orphan if it has an ancestors path but no connection.
        setFieldState(ancestorsPath, slug, true);
        setIsOrphan(true);
      } else {
        setFieldState(connectedAncestorsPath, getPermalinkSlug(value), true);
      }

      setIsConnected(true);
    } catch (err) {
      toggleNotification({
        type: 'warning',
        message:
          err?.response?.data?.error?.message ??
          formatMessage({
            id: getTrad('notification.error'),
            defaultMessage: 'An error occurred',
          }),
      });

      console.error(err);
    }
  };

  const removeAncestorsPath = () => {
    const newSlug = getPermalinkSlug(value);

    // Update field state.
    setIsOrphan(false);
    setFieldState(null, newSlug);
  };

  const updateAncestorsPath = async () => {
    setIsLoading(true);
    setIsOrphan(false);

    // Maybe remove ancestors path.
    if (!targetRelationValue) {
      removeAncestorsPath();
      setIsLoading(false);

      return;
    }

    const newSlug = getPermalinkSlug(value);

    // Maybe fetch a new ancestors path.
    try {
      const encodedSlug = encodeURIComponent(newSlug);
      const params = isCreatingEntry
        ? `${contentTypeUID}/${targetRelationValue.id}`
        : `${contentTypeUID}/${modifiedData.id}/${targetRelationValue.id}/${encodedSlug}`;
      const endpoint = getApiUrl(`${pluginId}/ancestors-path/${params}`);

      const {
        data: { path: connectedAncestorsPath },
      } = await fetchClient.get(endpoint);

      setFieldState(connectedAncestorsPath, newSlug);
    } catch (err) {
      const res = err?.response;

      // Maybe set field error to incidate relationship conflict.
      if (res?.status === 409) {
        const conflictAncestorsPath = res?.data?.error?.details?.path;

        if (conflictAncestorsPath) {
          setFieldState(conflictAncestorsPath, newSlug, false, false);
          setAvailability(null);
        } else {
          removeAncestorsPath();
        }

        setFieldError(
          res?.data?.error?.message ??
            formatMessage(
              {
                id: getTrad('form.error.parent-child'),
                defaultMessage: 'Cannot assign the {relation} relation as its own descendant.',
              },
              {
                relation: targetFieldConfig.targetRelation,
              }
            )
        );

        return;
      }

      toggleNotification({
        type: 'warning',
        message:
          res?.data?.error?.message ??
          formatMessage({
            id: getTrad('notification.error'),
            defaultMessage: 'An error occurred',
          }),
      });

      console.error(err);
    }

    setIsLoading(false);
  };

  const handleChange = (event) => {
    // Remove slash characters from the input value because they are used as the path separator.
    const newSlug = sanitizeSlug(event.target.value);

    if (newSlug && isCreatingEntry) {
      setIsCustomized(true);
    }

    setSlug(newSlug);

    onChange({
      target: {
        name,
        value: getPermalink(ancestorsPath, newSlug, lowercase),
        type: 'text',
      },
    });
  };

  const handleGenerateMouseEnter = () => {
    setRegenerateLabel(
      formatMessage({
        id: 'content-manager.components.uid.regenerate',
        defaultMessage: 'Regenerate',
      })
    );
  };

  const handleGenerateMouseLeave = () => {
    setRegenerateLabel(null);
  };

  const handleRefresh = () => {
    // Clear orphan state when refreshing.
    if (isOrphan && !!fieldError) {
      setIsOrphan(false);
      setAncestorsPath(null);
      setFieldError(null);

      return;
    }

    generateUID.current();
  };

  generateUID.current = async (shouldSetInitialValue = false) => {
    setIsLoading(true);

    try {
      const params = `${contentTypeUID}/${encodeURIComponent(debouncedTargetValue)}`;
      const endpoint = getApiUrl(`${pluginId}/suggestion/${params}`);

      const {
        data: { suggestion: newSlug },
      } = await fetchClient.get(endpoint);

      const newAncestorsPath = isOrphan ? null : ancestorsPath;

      setFieldState(newAncestorsPath, newSlug, shouldSetInitialValue);
      setIsLoading(false);
    } catch (err) {
      toggleNotification({
        type: 'warning',
        message:
          err?.response?.error?.message ??
          formatMessage({
            id: getTrad('notification.error'),
            defaultMessage: 'An error occurred',
          }),
      });

      setIsLoading(false);

      console.error(err);
    }
  };

  /* 
    This uses the ancestor id as a trigger to re-render the 
    ancestors path When a user changes locales.
  */
  useEffect(() => {
    if (initialData.id) {
      setAncestorID(initialData.id);
    }
  }, [initialData.id]);

  // added dataId as dependency, so this check will happen when the dataId changes
  useEffect(() => {
    if (isConnected) {
      return;
    }

    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancestorID, isConnected]);

  useEffect(() => {
    if (isOrphan) {
      setFieldError(
        formatMessage({
          id: getTrad('form.error.orphan'),
          defaultMessage: 'This value must be regenerated after being orphaned.',
        })
      );

      toggleNotification({
        type: 'warning',
        message: formatMessage(
          {
            id: getTrad('notification.warning.orphan'),
            defaultMessage: 'This {singularName} has been orphaned since it was last saved.',
          },
          {
            singularName: layout.info.singularName,
          }
        ),
        timeout: 3500,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrphan]);

  useEffect(() => {
    if (
      debouncedValue &&
      debouncedValue !== initialValue &&
      URI_COMPONENT_REGEX.test(debouncedValue)
    ) {
      checkAvailability();
    }

    if (!debouncedValue || debouncedValue === initialValue) {
      setAvailability(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, debouncedValue]);

  useEffect(() => {
    let timer;

    if (availability && availability.isAvailable) {
      timer = setTimeout(() => {
        setAvailability(null);
      }, 4000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability?.isAvailable]);

  useEffect(() => {
    if (
      !isCustomized &&
      isCreatingEntry &&
      debouncedTargetValue &&
      modifiedData[targetFieldConfig.targetField] &&
      !value
    ) {
      generateUID.current(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreatingEntry, isCustomized, debouncedTargetValue]);

  useEffect(() => {
    // Remove ancestors path if we have selected the current entity as the parent.
    if (selectedSelfRelation) {
      removeAncestorsPath();

      setFieldError(
        formatMessage(
          {
            id: getTrad('form.error.parent-self'),
            defaultMessage: 'Cannot assign the {relation} relation to itself.',
          },
          {
            relation: targetFieldConfig.targetRelation,
          }
        )
      );

      return;
    }

    // Maybe update the input value. If this entity is an orphan, we need to
    // leave the ancestors path visible until a new value is set.
    if (!targetRelationValue && !isOrphan) {
      removeAncestorsPath();
    }

    // Maybe set new ancestors path.
    if (targetRelationValue && targetRelationValue !== initialRelationValue) {
      updateAncestorsPath();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRelationValue, targetRelationValue]);

  return (
    <RelativeInputWrapper>
      <TextInput
        ref={ref}
        disabled={disabled}
        error={fieldError ?? formattedError}
        hint={hint}
        label={label}
        labelAction={labelAction}
        name={name}
        onChange={handleChange}
        placeholder={formattedPlaceholder}
        value={slug ? getPermalink(null, slug, lowercase) : ''}
        required={required}
        startAction={
          ancestorsPath ? (
            <AncestorsPath path={ancestorsPath} hasError={!!fieldError || !!error} />
          ) : null
        }
        endAction={
          <EndActionWrapper>
            {!regenerateLabel && availability && availability?.isAvailable && (
              <TextValidation alignItems="center" justifyContent="flex-end">
                <CheckCircle />
                <Typography textColor="success600" variant="pi">
                  {formatMessage({
                    id: 'content-manager.components.uid.available',
                    defaultMessage: 'Available',
                  })}
                </Typography>
              </TextValidation>
            )}
            {!regenerateLabel && availability && !availability?.isAvailable && (
              <TextValidation alignItems="center" justifyContent="flex-end" notAvailable>
                <ExclamationMarkCircle />
                <Typography textColor="danger600" variant="pi">
                  {formatMessage({
                    id: 'content-manager.components.uid.unavailable',
                    defaultMessage: 'Unavailable',
                  })}
                </Typography>
              </TextValidation>
            )}
            {regenerateLabel && (
              <TextValidation alignItems="center" justifyContent="flex-end">
                <Typography textColor="primary600" variant="pi">
                  {regenerateLabel}
                </Typography>
              </TextValidation>
            )}
            <FieldActionWrapper
              label="regenerate"
              onClick={handleRefresh}
              onMouseEnter={handleGenerateMouseEnter}
              onMouseLeave={handleGenerateMouseLeave}
            >
              {isLoading ? (
                <LoadingWrapper>
                  <Loader />
                </LoadingWrapper>
              ) : (
                <Refresh />
              )}
            </FieldActionWrapper>
          </EndActionWrapper>
        }
      />
    </RelativeInputWrapper>
  );
});

PermalinkInput.defaultProps = {
  disabled: false,
  error: undefined,
  hint: '',
  labelAction: undefined,
  placeholder: undefined,
  ref: undefined,
  required: false,
  value: '',
};

PermalinkInput.propTypes = {
  attribute: PropTypes.shape({
    targetField: PropTypes.string,
    required: PropTypes.bool,
  }).isRequired,
  contentTypeUID: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  hint: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  intlLabel: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  }).isRequired,
  labelAction: PropTypes.element,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  }),
  ref: PropTypes.shape({ current: PropTypes.any }),
  required: PropTypes.bool,
  value: PropTypes.string,
};

export default PermalinkInput;
