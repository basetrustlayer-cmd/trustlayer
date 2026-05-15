import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const specPath = path.join(process.cwd(), "../../api-spec/openapi.yaml");
  const spec = await readFile(specPath, "utf8");

  return new NextResponse(spec, {
    status: 200,
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
