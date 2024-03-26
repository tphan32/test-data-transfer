import { uploadFileToAzure } from "@tphan32/data-transfer";

export async function POST(request) {
  const {encrypted, fileName} = await request.json();
  console.log("encrypted", Buffer.from(encrypted));
  console.log("fileName", fileName);
  // console.log("process.env", process.env.AZURE_STORAGE_CONNECTION_STRING);
  const maskedfileName = await uploadFileToAzure("file", "fileName");
  // return Response.json({ message: "Hello World" });
  return Response.json({fileName: maskedfileName});
}