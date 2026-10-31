import { z } from 'zod';

export function validate(schema: z.ZodObject<any> | z.ZodEffects<any>) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.slice(1).join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Replace request data with parsed/coerced data
    req.body = result.data.body ?? req.body;
    req.params = result.data.params ?? req.params;
    req.query = result.data.query ?? req.query;

    return next();
  };
}

