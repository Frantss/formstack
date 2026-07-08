type FieldErrorField = {
  state: {
    status: {
      valid: boolean;
    };
    issues: {
      error: Array<{
        issue: {
          message: string;
        };
      }>;
    };
  };
};

export const FieldError = ({ field }: { field: FieldErrorField }) => {
  if (field.state.status.valid) {
    return null;
  }

  return <span className='field-error'>{field.state.issues.error.map(error => error.issue.message).join(', ')}</span>;
};
