import { Elysia, t } from "elysia";

export const authModel = new Elysia().model({
  signup: t.Object({
    name: t.String(),
    email: t.String(),
    password: t.String(),
  }),
  login: t.Object({
    email: t.String(),
    password: t.String(),
  }),
});
