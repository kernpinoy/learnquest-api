import { Hono } from "hono";
import login from "./routes/login";
import logout from "./routes/logout";

const app = new Hono();

app.route("/login", login);
app.route("/logout", logout);

export default {
  port: 3030,
  fetch: app.fetch,
};
