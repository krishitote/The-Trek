import Joi from 'joi';

export const validateActivity = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string().max(50).required(),
    distance_km: Joi.number().positive().max(1000).required(),
    duration_min: Joi.number().integer().positive().max(1440).required(),
    date: Joi.date().iso().max('now').optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: error.details[0].message 
    });
  }
  next();
};

export const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, and number'
      }),
    first_name: Joi.string().max(100).allow('').optional(),
    last_name: Joi.string().max(100).allow('').optional(),
    gender: Joi.string().valid('male', 'female', 'other').allow(null).optional(),
    age: Joi.number().integer().min(13).max(120).allow(null).optional(),
    weight: Joi.number().positive().max(500).allow(null).optional(),
    height: Joi.number().positive().max(300).allow(null).optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details[0].message 
    });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  next();
};