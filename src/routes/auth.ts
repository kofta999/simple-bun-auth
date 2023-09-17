import { Elysia, t } from "elysia";
import { db } from "../libs/prisma";
import { setup } from "../libs/setup";
import { authModel } from "../models/auth.model";
import { isAuthenticated } from "../middlewares/auth.middleware";

export const auth = new Elysia()
  .use(authModel)
  .use(setup)
  .post(
    "signup",
    async ({ body, set }) => {
      const { name, email, password } = body;
      const existingUser = await db.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingUser) {
        set.status = 400;
        return {
          success: false,
          statusMessage: "Email address already in use",
          data: null,
        };
      }
      const hashedPassword = await Bun.password.hash(password);
      const newUser = await db.user.create({
        data: {
          name,
          email,
          hashedPassword,
        },
      });
      return {
        success: true,
        statusMessage: "Created user successfully",
        data: {
          user: newUser,
        },
      };
    },
    {
      body: "signup",
    }
  )
  .post(
    "/login",
    async ({ jwt, setCookie, body, set }) => {
      const { email, password } = body;
      const existingUser = await db.user.findUnique({
        where: {
          email,
        },
      });
      if (!existingUser) {
        set.status = 404;
        return {
          success: false,
          statusMessage: "User not found",
          data: null,
        };
      }
      const checkPassword = await Bun.password.verify(
        password,
        existingUser.hashedPassword
      );
      if (!checkPassword) {
        set.status = 401;
        return {
          success: false,
          statusMessage: "Wrong password",
          data: null,
        };
      }
      const accessToken = await jwt.sign({ userId: existingUser.id });
      setCookie("access_token", accessToken, {
        maxAge: 7 * 86400,
        signed: true,
      });
      return {
        success: true,
        statusMessage: "Successfully logged in",
        data: {
          user: {
            name: existingUser.name,
            email: existingUser.email,
          },
        },
      };
    },
    {
      body: "login",
    }
  )
  .use(isAuthenticated)
  .get("/", ({ response }) => response);
