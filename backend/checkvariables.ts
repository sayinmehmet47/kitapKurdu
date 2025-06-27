import { logger } from './logger';

export const checkEnvVariables = () => {
  const requiredVariables = [
    'MONGO_URI',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET_KEY',
    'ACCESS_TOKEN_SECRET_KEY',
    'PORT',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];
  const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missingVariables.length > 0) {
    const missingVariablesString = missingVariables.join(', ');
    logger.error(`Missing environment variables: ${missingVariablesString}`);
    throw new Error(`Missing environment variables: ${missingVariablesString}`);
  }
};
