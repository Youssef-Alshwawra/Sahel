import { loadDataCourses } from "@/lib/data-courses.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = await loadDataCourses();

  return Response.json(result, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

