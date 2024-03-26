import { downloadFileFromAzure } from "@tphan32/data-transfer";

export async function POST(request) {
  const {fileName} = await request.json();
  console.log("fileName", fileName);
  const file = await downloadFileFromAzure("21758468787094887-hello.txt");
  console.log("downloadFile", file);
  return Response.json(file);
}