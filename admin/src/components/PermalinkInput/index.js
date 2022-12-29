import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Field, FieldError, FieldHint, FieldLabel } from '@strapi/design-system/Field';
import { Stack } from '@strapi/design-system/Stack';

const PermalinkInput = ( props ) => {
  console.log( 'PROPS', props );
  const {
    attribute,
    description,
    disabled,
    error,
    intlLabel,
    labelAction,
    name,
    onChange,
    required,
    value,
  } = props;
  const { formatMessage } = useIntl();

  return (
    <Field
      id={ name }
      name={ name }
      error={ error }
      hint={ description && formatMessage( description ) }
    >
      <Stack spacing={ 1 }>
        <FieldLabel action={ labelAction } required={ required }>
          { formatMessage( intlLabel ) }
        </FieldLabel>
        <p><mark>Input goes here</mark></p>
        <FieldHint />
        <FieldError />
      </Stack>
    </Field>
  );
};

PermalinkInput.defaultProps = {
  description: null,
  disabled: false,
  error: null,
  labelAction: null,
  required: false,
  value: '',
};

PermalinkInput.propTypes = {
  attribute: PropTypes.object.isRequired,
  description: PropTypes.object,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  intlLabel: PropTypes.object.isRequired,
  labelAction: PropTypes.object,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.string,
};

export default PermalinkInput;
