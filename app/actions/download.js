"use server";

import { downloadFileFromAzure } from "@tphan32/data-transfer";
export default async function downloadFile(fileName) {
  const file = await downloadFileFromAzure(fileName);
  // console.log("downloadFile", file);
  return file;
}