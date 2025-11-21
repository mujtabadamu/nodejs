import Joi from "joi"; 

const userSchema = Joi.object({ 
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
});

export const validateUserInput = (req: any, res: any, next: Function) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: "Invalid input",
      error: error.details[0].message,
    });
  }
  next();
}
