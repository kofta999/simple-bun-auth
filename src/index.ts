import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./routes/auth";

const app = new Elysia()
  .use(
    swagger({
      path: "/swagger",
    })
  )
  .group("/api", (app) => app.group("/auth", (app) => app.use(auth)))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
