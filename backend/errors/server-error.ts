import { CustomError } from './custom-error';

export class ServerError extends CustomError {
  statusCode = 500;

  constructor(message = 'Internal Server Error') {
    super(message);

    Object.setPrototypeOf(this, ServerError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
