import { Elysia, t } from "elysia";

const passwordSchema = t.String({
  minLength: 8,
  pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
  default: "Minimum 8 characters, at least one uppercase letter, one lowercase letter, and one digit"
});

const emailSchema = t.String({
  format: "email",
  default: "Email format such as example@example.com"
})

export const authModel = new Elysia().model({
  signup: t.Object({
    name: t.String({ minLength: 3 }),
    email: emailSchema,
    password: passwordSchema,
  }),
  login: t.Object({
    email: emailSchema,
    password: passwordSchema,
  }),
  resetPassword: t.Object({
    email: emailSchema,
  }),
  newPassword: t.Object({
    password: passwordSchema,
    userId: t.String()
  }),
});
