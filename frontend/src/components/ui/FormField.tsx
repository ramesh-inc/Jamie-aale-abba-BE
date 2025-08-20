import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  'aria-describedby'?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  children,
  className = '',
  'aria-describedby': ariaDescribedBy,
}) => {
  const fieldId = `field-${name}`;
  const errorId = `error-${name}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={fieldId} className="form-label">
        {label}
        {required && (
          <span className="text-error-500 ml-1" aria-label="required field">
            *
          </span>
        )}
      </label>

      {children ? (
        <div className="relative">
          {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id: fieldId,
            name,
            value,
            onChange,
            onBlur,
            className: `form-input ${error ? 'error' : ''}`,
            'aria-invalid': error ? 'true' : 'false',
            'aria-describedby': error ? errorId : ariaDescribedBy,
            disabled,
            required,
          })}
        </div>
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`form-input ${error ? 'error' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : ariaDescribedBy}
          disabled={disabled}
          required={required}
        />
      )}

      {error && (
        <div id={errorId} className="form-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;