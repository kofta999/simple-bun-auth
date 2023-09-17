import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { cookie } from "@elysiajs/cookie";

export const setup = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .use(
    cookie({
      httpOnly: true,
      secret: process.env.COOKIE_SECRET!,
    })
  );
