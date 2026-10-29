import "server-only";

/** Extract plain text from an uploaded PDF or text file. */
export async function extractResumeText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) return buffer.toString("utf8");

  // Import the library entry directly: pdf-parse's index.js runs a debug
  // routine that tries to read a test PDF from disk.
  const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
  const result = await pdfParse(buffer);
  return result.text;
}
