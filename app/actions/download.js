"use server";

import { downloadFileFromAzure } from "@tphan32/data-transfer";
export default async function downloadFile(fileName) {
  console.log("downloadFile", fileName);
  const rawData = await downloadFileFromAzure(fileName);
  // console.log("downloadFile", file);
  const file = new Blob([rawData]);
  // console.log("downloadFile", file);
  return file;
}