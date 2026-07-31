export type Result<T = unknown> = {
  success: boolean;
  message?: string;
  errors?: T;
};
