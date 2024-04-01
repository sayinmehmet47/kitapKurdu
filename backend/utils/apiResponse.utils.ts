import { StatusCodes } from 'http-status-codes';

interface ErrorDetail {
  path: string;
  message: string;
}

interface Errors {
  details: ErrorDetail[];
}

const errorsCustomMessage = (errors: Errors) =>
  errors.details.reduce(
    (acc, curr) => ({
      ...acc,
      [curr.path]: curr.message,
    }),
    {}
  );

interface ApiResponse {
  code: number;
  status: string;
  message: string;
  data?: any;
  errors?: Record<string, string>;
}

export const apiResponse = (
  code?: number,
  status?: string,
  message?: string,
  data?: any
): ApiResponse => {
  const result: ApiResponse = {
    code: code || StatusCodes.OK,
    status: status || 'OK',
    message: message || '',
    data: data,
  };

  return result;
};

export const apiResponseValidationError = (errors: Errors): ApiResponse => {
  const result: ApiResponse = {
    code: StatusCodes.UNPROCESSABLE_ENTITY,
    status: 'UNPROCESSABLE_ENTITY',
    message: 'The given data was invalid.',
    errors: errorsCustomMessage(errors),
  };

  return result;
};
