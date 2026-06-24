import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseCourse, type Course } from "./schema";

export type DataCourseError = {
  file: string;
  message: string;
};

export type DataCoursesResult = {
  courses: Course[];
  errors: DataCourseError[];
};

const DATA_DIRECTORY = path.join(process.cwd(), "data");

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Read and validate every top-level JSON course in the project's data folder. */
export async function loadDataCourses(): Promise<DataCoursesResult> {
  let entries;

  try {
    entries = await readdir(DATA_DIRECTORY, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { courses: [], errors: [] };

    return {
      courses: [],
      errors: [{ file: "data", message: errorMessage(error) }],
    };
  }

  const files = entries
    .filter(
      (entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".json"
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const courses: Course[] = [];
  const errors: DataCourseError[] = [];
  const courseFiles = new Map<string, string>();

  for (const file of files) {
    try {
      const raw = await readFile(path.join(DATA_DIRECTORY, file), "utf8");
      const parsed: unknown = JSON.parse(raw);
      const result = parseCourse(parsed);

      if (!result.ok) {
        errors.push({ file, message: result.errors.join("; ") });
        continue;
      }

      const firstFile = courseFiles.get(result.course.id);
      if (firstFile) {
        errors.push({
          file,
          message: `Duplicate course id "${result.course.id}" (already used by ${firstFile}).`,
        });
        continue;
      }

      courseFiles.set(result.course.id, file);
      courses.push(result.course);
    } catch (error) {
      errors.push({ file, message: errorMessage(error) });
    }
  }

  return { courses, errors };
}

