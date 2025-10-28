const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Nieprawidłowy format e-mail',
    'any.required': 'E-mail jest wymagany',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Hasło musi mieć co najmniej 6 znaków',
    'any.required': 'Hasło jest wymagane',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Nieprawidłowy format e-mail',
    'any.required': 'E-mail jest wymagany',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Hasło jest wymagane',
  }),
});

module.exports = {
  validateRegister: (data) => registerSchema.validate(data, { abortEarly: false }),
  validateLogin: (data) => loginSchema.validate(data, { abortEarly: false }),
};