import { sql } from "drizzle-orm";
import { teachersInfo, studentsInfo } from "./schema";

export const teacherFullName = sql<string>`CONCAT(
        ${teachersInfo.firstName},
        ' ',
        COALESCE(LEFT(${teachersInfo.middleName}, 1), ''),
        '. ',
        ${teachersInfo.lastName}
      )`;

export const studentFullName = sql<string>`CONCAT(
  ${studentsInfo.firstName},
  ' ',
  COALESCE(LEFT(${studentsInfo.middleName}, 1), ''),
  '. ',
  ${studentsInfo.lastName}
  )`;
