import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import generateClassCode from "./classcode-gen";

// Use enums for roles, class sesssions, and sex
export const role = pgEnum("role", ["admin", "teacher", "student"]);
export const classSession = pgEnum("class_session", ["morning", "afternoon"]);
export const gender = pgEnum("gender", ["male", "female"]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  salt: text("salt").notNull().unique(),
  role: role("role").notNull().default("teacher"),
  archived: boolean("archived").notNull().default(false),
  archivedAt: timestamp("archived_at", {
    withTimezone: true,
    mode: "date",
  }),
});

export const teachersInfo = pgTable("teachers_info", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  archived: boolean("archived").notNull().default(false),
  archivedAt: timestamp("archived_at", {
    withTimezone: true,
    mode: "date",
  }),
});

export const classrooms = pgTable("classrooms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachersInfo.id, { onDelete: "cascade" }),
  classCode: text("class_code")
    .notNull()
    .$defaultFn(() => generateClassCode(7)),
  name: text("name").notNull(),
  classSession: classSession("class_session").notNull(),
  schoolYear: text("school_year").notNull(),
  maxStudents: integer("max_students").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  archived: boolean("archived").notNull().default(false),
  archivedAt: timestamp("archived_at", {
    withTimezone: true,
    mode: "date",
  }),
});

export const studentsInfo = pgTable("students_info", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id, { onDelete: "cascade" }),
  userId: text("user_id") // User ID of student is LRN, take note!
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: gender("gender").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  archived: boolean("archived").notNull().default(false),
  archivedAt: timestamp("archived_at", {
    withTimezone: true,
    mode: "date",
  }),
});

export const studentRegistrations = pgTable("student_registrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  salt: text("salt").notNull().unique(),
  classCode: text("class_code").notNull(),
  teacherId: text("teacher_id").notNull(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: gender("gender").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const file_upload = pgTable("file_upload", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id, { onDelete: "cascade" }),
  bucket: text("bucket"),
  fileName: text("file_name"),
  originalName: text("original_name"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  size: integer("size"),
  fileType: text("filetype"),
});
