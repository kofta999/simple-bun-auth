import { Elysia, t } from "elysia";
import { db } from "../libs/prisma";
import { setup } from "../libs/setup";
import { authModel } from "../models/auth.model";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { randomBytes } from "crypto";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)


export const auth = new Elysia()
  .use(authModel)
  .use(setup)
  .post(
    "signup",
    async ({ body, set }) => {
      const { name, email, password } = body;
      const existingUser = await db.users.findUnique({
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
      const newUser = await db.users.create({
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
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
          },
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
      const existingUser = await db.users.findUnique({
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
  .post(
    "/reset",
    async ({ body, set }) => {
      const { email } = body;
      const token = randomBytes(32).toString("hex");
      const user = await db.users.findUnique({
        where: { email }
      })
      if (!user) {
        set.status = 404;
        return {
          success: false,
          status_message: "User not found",
          data: null,
        };
      }

      await db.users.update({
        where: {
          email
        },
        data: {
          resetToken: token,
          resetTokenExpiration: new Date(Date.now() + 3600000)
        }
      })
      await sgMail.send(
        {
          to: email,
          from: "mostafaxxx555@gmail.com",
          subject: "Password reset",
          html: `
          <p>You requested a password reset</p>
          <p>Click this to reset your password, valid only for 1 hour</p>
          <a href="http://localhost:3000/reset/${token}">Link</a>`,
        }
      )
      console.log(`http://localhost:3000/reset/${token}`);
      return {
        sucess: true,
        status_message: "Successfully sent a password reset email",
        data: null
      }

    },
    {
      body: "resetPassword",
    }
  )
  .post("/reset/:token", async ({ params, set, body, }) => {
    const { token } = params;
    const { password, userId } = body
    const user = db.users.findUnique({
      where: {
        id: userId,
        resetToken: token,
        resetTokenExpiration: { gt: new Date(Date.now()) }
      }
    })
    if (!user) {
      set.status = 404;
      return {
        success: false,
        status_message: "User not found",
        data: null
      }
    }
    const newPassword = await Bun.password.hash(password);
    await db.users.update({
      where: {
        id: userId
      },
      data: {
        hashedPassword: newPassword,
        resetToken: null,
        resetTokenExpiration: null
      }
    })
    return {
      success: true,
      status_message: "Created new password for the user",
      data: {
        userId
      }
    }
  },
    {
      body: 'newPassword',
      params: t.Object({ token: t.String() })
    })
  .use(isAuthenticated)
  .get("/", ({ response }) => response);
