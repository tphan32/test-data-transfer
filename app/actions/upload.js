"use server";

import { uploadFileToAzure } from "@tphan32/data-transfer";
export default async function uploadFile(formData) {
  const fileName = formData.get("fileName");
  const file = await formData.get("file").arrayBuffer();
  console.log("uploadFile in backend");
  const name = uploadFileToAzure(file, fileName);
  return name;
}
