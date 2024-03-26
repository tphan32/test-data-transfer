"use server";

import { uploadFileToAzure } from "@tphan32/data-transfer";
export default async function uploadFile(file, fileName) {
  const name = await uploadFileToAzure(file, fileName);
  return name;
}