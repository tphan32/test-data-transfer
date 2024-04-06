import { NextResponse } from "next/server";
import { azureUploadInfo } from "@/app/data/storage";
import { generateBlockID, generateUniqueFileName } from "../../utils/utils";

export async function POST(request) {
  const { container } = azureUploadInfo;
  const formData = await request.formData();
  const file = new Uint8Array(await formData.get("file").arrayBuffer());
  const fileName = formData.get("fileName");
  const totalChunks = +formData.get("totalChunks");
  const [blobName, seq] = fileName.split("_");
  try {
    if (!azureUploadInfo.blockBlobClient) {
      azureUploadInfo.uniqueBlobName = generateUniqueFileName(blobName);
      azureUploadInfo.blockBlobClient = container.getBlockBlobClient(
        azureUploadInfo.uniqueBlobName
      );
    }
    const blockId = generateBlockID(fileName, seq);
    await azureUploadInfo.blockBlobClient.stageBlock(
      blockId,
      file,
      file.byteLength
    );
    if (!azureUploadInfo.blockIds) {
      azureUploadInfo.blockIds = new Array(totalChunks);
    }
    console.log(`UPLOAD FILE POST: uploaded chunk ${fileName} successfully`);
    azureUploadInfo.blockIds[+seq] = blockId;
    azureUploadInfo.count += 1;
    if (azureUploadInfo.count === totalChunks) {
      await azureUploadInfo.blockBlobClient.commitBlockList(
        azureUploadInfo.blockIds
      );
      console.log(
        `UPLOAD FILE POST: committed blob ${blobName} successfully`,
        azureUploadInfo.count
      );
      azureUploadInfo.blockBlobClient = null;
      azureUploadInfo.blockIds = null;
      azureUploadInfo.count = 0;
      azureUploadInfo.uniqueBlobName = null;
      return NextResponse.json(
        { message: "success", numUploadedChunks: totalChunks },
        { status: 200 }
      );
    }
  } catch (e) {
    console.error("error in POST: ", e);
    return NextResponse.json({ message: "error" }, { status: 500 });
  }

  return NextResponse.json(
    {
      message: "success",
      numUploadedChunks: azureUploadInfo.count,
      fileNameInAzure: azureUploadInfo.uniqueBlobName,
    },
    { status: 200 }
  );
}
