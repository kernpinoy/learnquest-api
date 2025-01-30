import { Hono } from "hono";
import { db } from "../db";
import { count, eq } from "drizzle-orm";
import {
  classrooms,
  studentRegistrations,
  studentsInfo,
  users,
} from "../db/schema";
import { logger } from "hono/logger";
import { customLogger } from "../lib/custom-logger";
import { getSalt, hashPassword } from "../lib/hash";

const app = new Hono();
app.use(logger(customLogger));

type Register = {
  lrn: string;
  firstName: string;
  middleName: string;
  lastName: string;
  sex: "male" | "female";
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

  let { lrn, firstName, middleName, lastName, sex, password, classCode } = body;

  if (
    !lrn ||
    !firstName ||
    !middleName ||
    !lastName ||
    !sex ||
    !password ||
    !classCode
  ) {
    return c.json(
      { message: "All fields are required. Please fill in all the fields." },
      400
    );
  }

  if (!/^\d{12}$/.test(lrn)) {
    return c.json({ message: "LRN must be a 12-digit number." }, 400);
  }

  const existingClass = await db.query.classrooms.findFirst({
    where: eq(classrooms.classCode, classCode),
  });

  if (!existingClass) {
    return c.json(
      { message: "Class code is invalid. Please check your class code." },
      400
    );
  }

  // check if class is full
  const [studentCount] = await db
    .select({
      count: count(),
    })
    .from(studentsInfo)
    .where(eq(studentsInfo.classroomId, existingClass.id));

  if (studentCount.count == existingClass.maxStudents) {
    return c.json({ message: "Class already full." }, 400);
  }

  // Process names for proper capitalization
  firstName = body.firstName
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  middleName = body.middleName
    .trim()
    .split(" ")
    .map((word) => {
      const lowerWord = word.toLowerCase();
      if (["van", "von"].includes(lowerWord)) {
        return lowerWord;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  lastName = body.lastName
    .trim()
    .split(" ")
    .map((word) => {
      const lowerWord = word.toLowerCase();
      if (["dela", "de", "van", "von"].includes(lowerWord)) {
        return lowerWord;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  const teacherId = await db.query.classrooms.findFirst({
    where: eq(classrooms.classCode, classCode),
    columns: {
      teacherId: true,
    },
  });

  // Ensure teacherId is defined before proceeding
  if (!teacherId?.teacherId) {
    return c.json(
      { message: "Teacher ID not found. Please check the class code." },
      400
    );
  }

  // check if student already in student info (if nasa studentinfo na, edi nasa users narin creds nun)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, lrn),
  });

  const existingRegister = await db.query.studentRegistrations.findFirst({
    where: eq(studentRegistrations.username, lrn),
  });

  if (existingUser || existingRegister) {
    return c.json({ message: "Username already taken. Try again." }, 409);
  }

  // store user data in the registration
  const result = await db.transaction(async (tx) => {
    try {
      // get salt for password, and use it to hash pw
      const salt = getSalt();
      const saltText = salt.toString("base64");
      const hashedPw = await hashPassword(password, salt);

      // do the save db
      await tx.insert(studentRegistrations).values({
        username: lrn,
        hashedPassword: hashedPw,
        salt: saltText,
        classCode: classCode,
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        gender: sex,
        teacherId: teacherId.teacherId,
      });

      customLogger("Registration success:", lrn);
      return {
        success: true,
        message:
          "Successfully registered. Please wait to be accepted by the teacher.",
      };
    } catch (error) {
      customLogger("Register transaction failed:", `${error}`);
      return {
        success: false,
        message: "Registration failed. Please try again.",
      };
    }
  });

  if (!result.success) {
    return c.json({ message: result.message }, 500);
  }

  return c.json({ message: result.message }, 201);
});

export default app;
