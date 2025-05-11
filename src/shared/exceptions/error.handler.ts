import { HttpStatus } from "@nestjs/common";

export class ErrorHandler {
    static badRequest(message: string) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message
      };
    }
  
    static unauthorized(message: string = 'Unauthorized') {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'Unauthorized',
        message
      };
    }
  
    static forbidden(message: string = 'Forbidden') {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        message
      };
    }
  
    static notFound(message: string = 'Not Found') {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message
      };
    }
  
    static internalServerError(message: string = 'Internal Server Error') {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message
      };
    }
  }