import Joi from 'joi';

// Generous upper bounds; manual entries above these are almost certainly mistakes or cheating.
const ACTIVITY_LIMITS = {
  Running: { maxKmh: 30, maxKm: 250 },
  Walking: { maxKmh: 10, maxKm: 100 },
  Hiking: { maxKmh: 10, maxKm: 100 },
  Cycling: { maxKmh: 80, maxKm: 600 },
  Swimming: { maxKmh: 8, maxKm: 60 },
  Steps: { maxKmh: 10, maxKm: 100 },
};

function getActivityLimitError(body) {
  const limits = Object.hasOwn(ACTIVITY_LIMITS, body.type) ? ACTIVITY_LIMITS[body.type] : null;
  if (!limits) return null;

  const distanceKm = Number(body.distance_km);
  const hours = Number(body.duration_min) / 60;
  if (distanceKm > limits.maxKm) {
    return `${body.type} distance cannot exceed ${limits.maxKm} km in one activity.`;
  }
  if (distanceKm / hours > limits.maxKmh) {
    return `That pace is too fast for ${body.type}. Check the distance and duration.`;
  }
  return null;
}

export const validateActivity = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string().max(50).required(),
    distance_km: Joi.number().positive().max(1000).required(),
    duration_min: Joi.number().integer().positive().max(1440).required(),
    date: Joi.date().iso().max('now').optional(),
    location: Joi.string().max(200).allow('', null).optional(),
    elevation_gain: Joi.number().integer().min(0).max(100000).allow(null).optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: error.details[0].message 
    });
  }

  const limitError = getActivityLimitError(req.body);
  if (limitError) {
    return res.status(400).json({ error: 'Invalid input', details: limitError });
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
    show_on_leaderboard: Joi.boolean().optional(),
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

// User profile update validation
export const validateProfileUpdate = (req, res, next) => {
  const schema = Joi.object({
    first_name: Joi.string().max(100).allow('').optional(),
    last_name: Joi.string().max(100).allow('').optional(),
    gender: Joi.string().valid('male', 'female').required(),
    date_of_birth: Joi.date().max('now').required(),
    weight: Joi.number().positive().max(500).allow(null).optional(),
    height: Joi.number().positive().max(300).allow(null).optional(),
    show_on_leaderboard: Joi.boolean().optional(),
  }).min(1); // At least one field required

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid profile data', 
      details: error.details[0].message 
    });
  }
  next();
};

// Refresh token validation
export const validateRefreshToken = (req, res, next) => {
  const schema = Joi.object({
    refreshToken: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }
  next();
};
export const validateLeaderboardChoice = (req, res, next) => {
  const schema = Joi.object({
    show_on_leaderboard: Joi.boolean().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: 'show_on_leaderboard must be true or false' });
  }
  next();
};
