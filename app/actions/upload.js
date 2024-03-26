"use server";

import { uploadFileToAzure } from "@tphan32/data-transfer";
export default async function uploadFile(file, fileName) {
  console.log("process.env", process.env.AZURE_STORAGE_CONNECTION_STRING);
  console.log("process.env", process.env.AZURE_STORAGE_CONTAINER_NAME);
  console.log("uploadFile", file, fileName);
  const name = await uploadFileToAzure(file, fileName);
  return name;
}