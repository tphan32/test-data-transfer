import { uploadFileToAzure } from "@tphan32/data-transfer";

export async function POST(request) {
  const formData = await request.formData();
  let file = formData.get("file");
  if(typeof file === "string") {
    file = new Uint8Array(file.split(",").map((x) => parseInt(x)));
  } else {
    file = new Uint8Array(await file.arrayBuffer());
  }
  const fileName = formData.get("fileName");
  console.log("POST request: uploading file", fileName);
  const maskedfileName = await uploadFileToAzure(file, fileName);
  return Response.json({fileName: maskedfileName});
}
