import React from 'react';

type FieldControlProps = {
  id?: string;
  className?: string;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-required'?: React.AriaAttributes['aria-required'];
};

export interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactElement<FieldControlProps>;
}

export const Field: React.FC<FieldProps> = ({
  id,
  label,
  error,
  hint,
  required = false,
  children,
}) => {
  const messageId = `${id}-message`;
  const message = error || hint;
  const descriptionIds = [
    ...(children.props['aria-describedby']?.split(/\s+/).filter(Boolean) || []),
    ...(message ? [messageId] : []),
  ];
  const describedBy = descriptionIds.length > 0
    ? Array.from(new Set(descriptionIds)).join(' ')
    : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-bold text-ui-foreground">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-1 text-ui-danger">
            *
          </span>
        )}
      </label>
      {React.cloneElement(children, {
        id,
        required: required || children.props.required,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
        'aria-required': required || children.props['aria-required'] || undefined,
        className: `brand-input ${children.props.className || ''}`.trim(),
      })}
      {message && (
        <p id={messageId} className={`text-sm ${error ? 'text-ui-danger' : 'text-ui-muted'}`}>
          {message}
        </p>
      )}
    </div>
  );
};
