import serverlessExpress from '@vendia/serverless-express';
import app from './app.js';

/**
 * AWS Lambda handler wrapping the Express application
 */
export const handler = serverlessExpress({ app });
