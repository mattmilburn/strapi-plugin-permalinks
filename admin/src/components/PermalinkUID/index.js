import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { get } from 'lodash';
import { TextInput, Typography } from '@strapi/design-system';
import { useCMEditViewDataManager, useNotification } from '@strapi/helper-plugin';
import {
  CheckCircle,
  ExclamationMarkCircle,
  Loader,
  Refresh,
} from '@strapi/icons';

import {
  axiosInstance,
  getPermalink,
  getPermalinkAncestors,
  getPermalinkSlug,
  getTrad,
  pluginId,
} from '../../utils';
import AncestorsPath from './AncestorsPath';

// Import certain assets directly from core InputUID component.
import UID_REGEX from '../InputUID/regex';
import useDebounce from '../InputUID/useDebounce';
import {
  EndActionWrapper,
  FieldActionWrapper,
  TextValidation,
  LoadingWrapper,
} from '../InputUID/endActionStyle';

const PermalinkUID = ( {
  attribute,
  contentTypeUID,
  description,
  disabled,
  error,
  intlLabel,
  labelAction,
  name,
  onChange,
  value,
  placeholder,
  pluginOptions,
  required,
} ) => {
  const toggleNotification = useNotification();
  const { modifiedData, initialData, layout } = useCMEditViewDataManager();
  const [ isLoading, setIsLoading ] = useState( false );
  const [ availability, setAvailability ] = useState( null );
  const debouncedValue = useDebounce( value, 300 );
  const generateUid = useRef();
  const initialValue = initialData[ name ];
  const { formatMessage } = useIntl();
  const createdAtName = get( layout, [ 'options', 'timestamps', 0 ] );
  const isCreation = ! initialData[ createdAtName ];
  const debouncedTargetFieldValue = useDebounce( modifiedData[ attribute.targetField ], 300 );
  const [ isCustomized, setIsCustomized ] = useState( false );
  const [ regenerateLabel, setRegenerateLabel ] = useState( null );

  // Vars for handling permalink.
  const targetRelationValue = modifiedData[ pluginOptions.targetRelation ];
  const initialRelationValue = initialData[ pluginOptions.targetRelation ];
  const initialAncestorsPath = getPermalinkAncestors( initialValue );
  const initialSlug = getPermalinkSlug( initialValue );
  const initialIsOrphan = ! initialRelationValue && !! initialAncestorsPath;
  const [ isOrphan, setIsOrphan ] = useState( initialIsOrphan );
  const [ ancestorsPath, setAncestorsPath ] = useState( initialAncestorsPath );
  const [ slug, setSlug ] = useState( initialSlug );

  const label = intlLabel.id
    ? formatMessage(
        { id: intlLabel.id, defaultMessage: intlLabel.defaultMessage },
        { ...intlLabel.values }
      )
    : name;

  const hint = description
    ? formatMessage(
        { id: description.id, defaultMessage: description.defaultMessage },
        { ...description.values }
      )
    : '';

  const formattedPlaceholder = placeholder
    ? formatMessage(
        { id: placeholder.id, defaultMessage: placeholder.defaultMessage },
        { ...placeholder.values }
      )
    : '';

  const formattedError = error
    ? formatMessage( { id: error, defaultMessage: error } )
    : undefined;

  const formattedOrphanError = isOrphan
    ? formatMessage( {
      id: 'ui.error.orphan',
      defaultMessage: 'This value must be regenerated after being orphaned.',
    } )
    : undefined;

  generateUid.current = async ( shouldSetInitialValue = false ) => {
    setIsLoading( true );

    try {
      const {
        data: { data },
      } = await axiosInstance.post( '/content-manager/uid/generate', {
        contentTypeUID,
        field: name,
        data: modifiedData,
      } );

      // Update field state.
      setSlug( data );

      // Update field value.
      onChange( {
        target: {
          name,
          value: getPermalink( isOrphan ? null : ancestorsPath, data ),
          type: 'text',
        },
      }, shouldSetInitialValue );

      setIsLoading( false );
    } catch ( err ) {
      console.error( { err } );

      setIsLoading( false );
    }
  };

  const checkAvailability = async () => {
    setIsLoading( true );

    if ( ! value ) {
      return;
    }

    try {
      const { data } = await axiosInstance.post( '/content-manager/uid/check-availability', {
        contentTypeUID,
        field: name,
        value: getPermalink( isOrphan ? null : ancestorsPath, slug ),
      } );

      updateAncestorsPath();
      setAvailability( data );
      setIsLoading( false );
    } catch ( err ) {
      console.error( { err } );

      setIsLoading( false );
    }
  };

  const removeAncestorsPath = () => {
    const newSlug = getPermalinkSlug( value );

    // Update field state.
    setAncestorsPath( null );
    setSlug( newSlug );

    // Update field value with only the current slug (no ancestors).
    onChange( {
      target: {
        name,
        value: newSlug,
        type: 'text',
      },
    } );
  };

  const updateAncestorsPath = async () => {
    setIsLoading( true );

    // Always remove orphan state when modifying the parent relation.
    setIsOrphan( false );

    // Maybe remove ancestors path.
    if ( ! targetRelationValue ) {
      removeAncestorsPath();
      setIsLoading( false );
      return;
    }

    // Maybe fetch a new ancestors path.
    try {
      const endpoint = `${pluginId}/ancestors-path/${contentTypeUID}/${targetRelationValue.id}/${name}`;
      const {
        data: {
          path: newAncestorsPath,
        },
      } = await axiosInstance.get( endpoint );
      const newSlug = getPermalinkSlug( value );

      // Update field state.
      setAncestorsPath( newAncestorsPath );
      setSlug( newSlug );

      // Update field value with ancestors path included.
      onChange( {
        target: {
          name,
          value: getPermalink( newAncestorsPath, newSlug ),
          type: 'text',
        },
      } );
    } catch ( err ) {
      console.error( { err } );
    }

    setIsLoading( false );
  };

  useEffect( () => {
    if ( isOrphan ) {
      toggleNotification( {
        type: 'warning',
        message: {
          id: getTrad( 'notice.warning.orphan' ),
          defaultMessage: 'This entity has been orphaned since it was last saved.',
        },
        timeout: 3500,
      } );
    }
  }, [ isOrphan ] );

  useEffect( () => {
    if (
      debouncedValue &&
      debouncedValue.trim().match( UID_REGEX ) &&
      debouncedValue !== initialValue
    ) {
      checkAvailability();
    }

    if ( ! debouncedValue ) {
      setAvailability( null );
    }
  }, [ debouncedValue, initialValue ] );

  useEffect( () => {
    let timer;

    if ( availability && availability.isAvailable ) {
      timer = setTimeout( () => {
        setAvailability( null );
      }, 4000 );
    }

    return () => {
      if ( timer ) {
        clearTimeout( timer );
      }
    };
  }, [ availability ] );

  useEffect( () => {
    if (
      ! isCustomized &&
      isCreation &&
      debouncedTargetFieldValue &&
      modifiedData[ attribute.targetField ] &&
      ! value
    ) {
      generateUid.current( true );
    }
  }, [ debouncedTargetFieldValue, isCustomized, isCreation ] );

  useEffect( () => {
    const selectedSelf = targetRelationValue && targetRelationValue.id === modifiedData.id;

    // Maybe set new ancestors path.
    if (
      targetRelationValue &&
      targetRelationValue !== initialRelationValue &&
      ! selectedSelf
    ) {
      updateAncestorsPath();
    }

    // Maybe unset ancestors path. If this entity is an orphan, we need to leave
    // the ancestors path visible until a new value is set.
    if ( ( ! targetRelationValue && ! isOrphan ) || selectedSelf ) {
      updateAncestorsPath();

      onChange( {
        target: {
          name,
          value: getPermalinkSlug( value ),
          type: 'text',
        },
      } );
    }
  }, [ targetRelationValue, initialRelationValue ] );

  const handleGenerateMouseEnter = () => {
    setRegenerateLabel(
      formatMessage( {
        id: 'content-manager.components.uid.regenerate',
        defaultMessage: 'Regenerate',
      } )
    );
  };

  const handleGenerateMouseLeave = () => {
    setRegenerateLabel( null );
  };

  const handleChange = e => {
    const newSlug = e.target.value;

    if ( newSlug && isCreation ) {
      setIsCustomized( true );
    }

    setSlug( newSlug );

    onChange( {
      target: {
        name,
        value: getPermalink( ancestorsPath, newSlug ),
        type: 'text',
      },
    } );
  };

  return (
    <TextInput
      disabled={ disabled }
      error={ formattedOrphanError ?? formattedError }
      startAction={ ancestorsPath ? (
        <AncestorsPath path={ ancestorsPath } hasError={ isOrphan } />
      ) : null }
      endAction={
        <EndActionWrapper>
          { availability && availability.isAvailable && ! regenerateLabel && (
            <TextValidation alignItems="center" justifyContent="flex-end">
              <CheckCircle />
              <Typography textColor="success600" variant="pi">
                { formatMessage( {
                  id: 'content-manager.components.uid.available',
                  defaultMessage: 'Available',
                } ) }
              </Typography>
            </TextValidation>
          ) }
          { availability && ! availability.isAvailable && ! regenerateLabel && (
            <TextValidation notAvailable alignItems="center" justifyContent="flex-end">
              <ExclamationMarkCircle />
              <Typography textColor="danger600" variant="pi">
                { formatMessage( {
                  id: 'content-manager.components.uid.unavailable',
                  defaultMessage: 'Unavailable',
                } ) }
              </Typography>
            </TextValidation>
          ) }
          { regenerateLabel && (
            <TextValidation alignItems="center" justifyContent="flex-end">
              <Typography textColor="primary600" variant="pi">
                { regenerateLabel }
              </Typography>
            </TextValidation>
          ) }
          <FieldActionWrapper
            onClick={ () => generateUid.current() }
            label="regenerate"
            onMouseEnter={ handleGenerateMouseEnter }
            onMouseLeave={ handleGenerateMouseLeave }
          >
            { isLoading ? (
              <LoadingWrapper>
                <Loader />
              </LoadingWrapper>
            ) : (
              <Refresh />
            ) }
          </FieldActionWrapper>
        </EndActionWrapper>
      }
      hint={ hint }
      label={ label }
      labelAction={ labelAction }
      name={ name }
      onChange={ handleChange }
      placeholder={ formattedPlaceholder }
      value={ slug ?? '' }
      required={ required }
    />
  );
};

PermalinkUID.propTypes = {
  attribute: PropTypes.shape( {
    targetField: PropTypes.string,
    required: PropTypes.bool,
  } ).isRequired,
  contentTypeUID: PropTypes.string.isRequired,
  description: PropTypes.shape( {
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  } ),
  disabled: PropTypes.bool,
  error: PropTypes.string,
  intlLabel: PropTypes.shape( {
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  } ).isRequired,
  labelAction: PropTypes.element,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  placeholder: PropTypes.shape( {
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  } ),
  pluginOptions: PropTypes.shape( {
    uid: PropTypes.string,
    targetField: PropTypes.string,
    targetRelation: PropTypes.string,
  } ).isRequired,
  required: PropTypes.bool,
};

PermalinkUID.defaultProps = {
  description: undefined,
  disabled: false,
  error: undefined,
  labelAction: undefined,
  placeholder: undefined,
  pluginOptions: {},
  value: '',
  required: false,
};

export default PermalinkUID;
