import { Hono } from "hono";

const app = new Hono();

type Register = {
  lrn: string;
  schoolYear: string;
  firstName: string;
  middleName: string;
  lastName: string;
  sex: string;
  password: string;
  classCode: string;
};

app.post("/", async (c) => {
  let body: Register;

  try {
    body = await c.req.json<Register>();
  } catch {
    return c.json(
      { message: "Malformed JSON. Please check your request body." },
      400
    );
  }

  const {
    lrn,
    schoolYear,
    firstName,
    middleName,
    lastName,
    sex,
    password,
    classCode,
  } = body;

  // validate each one
});

export default app;
