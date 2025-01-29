import { Hono } from "hono";
import login from "./routes/login";
import logout from "./routes/logout";
import register from "./routes/register";
import files from "./routes/files";

const app = new Hono();

app.get("/", (c) => c.text("gelo"));

app.route("/login", login);
app.route("/logout", logout);
app.route("/register", register);
app.route("/files", files);

export default {
  port: 3030,
  fetch: app.fetch,
};
