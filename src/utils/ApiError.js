class ApiError extends Error {
    constructor (statusCode, message = "Some Went Wrong..", errors = [], stack = "") {
        super();
        this.message = message;
        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.errors = errors;
        if (stack) this.stack = stack;
        else Error.captureStackTrace(this, this.constructor);
    }
}
export default ApiError;