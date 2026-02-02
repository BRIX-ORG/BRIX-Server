import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.APP_PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api',
}));

export const appConfig = registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.APP_PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api',
    url: process.env.APP_URL || 'http://localhost:3000',
}));

export const cloudinaryConfig = registerAs('cloudinary', () => ({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
}));
