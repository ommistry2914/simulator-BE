import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const sendResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  res.status(statusCode).json(response);
};
