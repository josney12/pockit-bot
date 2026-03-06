import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // OpenAI
  OPENAI_API_KEY: Joi.string().required(),

  // WhatsApp Cloud API
  WHATSAPP_TOKEN: Joi.string().required(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().required(),
  WHATSAPP_VERIFY_TOKEN: Joi.string().required(),

  // PostgreSQL
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().integer().default(5432),
  DB_USER: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().default('pocki_bot'),

  // App
  PORT: Joi.number().integer().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});

