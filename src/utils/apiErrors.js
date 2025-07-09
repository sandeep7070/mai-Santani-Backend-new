export class ApiError extends  Error {
     constructor (
        statusCode,
        massage= 'SOMETHING WENT WRONG',
        errors = [],
        stack = ""
     ) {
        super(massage);
        (this.massage = massage),
        (this.error = errors),
        (this.data = null),
        (this.statusCode = statusCode)

        if (!stack) {
             this.stack = stack;

        }  else {
            Error.captureStackTrace(this, this.constructor)
        }

     }
}