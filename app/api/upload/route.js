import { NextResponse } from "next/server";
import {
  createAzureBlobServiceClient,
  getAzureContainer,
} from "@tphan32/data-transfer";

const blobServiceClient = createAzureBlobServiceClient(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const container = getAzureContainer(
  blobServiceClient,
  process.env.AZURE_STORAGE_CONTAINER_NAME
);

let blockBlobClient;
let blockIds;
let count = 0;
let uniqueBlobName;

function generateBlockID(blockIDPrefix, blockIndex) {
  function padStart(currentString, targetLength, padString = " ") {
    // @ts-expect-error: TS doesn't know this code needs to run downlevel sometimes
    if (String.prototype.padStart) {
      return currentString.padStart(targetLength, padString);
    }

    padString = padString || " ";
    if (currentString.length > targetLength) {
      return currentString;
    } else {
      targetLength = targetLength - currentString.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length);
      }
      return padString.slice(0, targetLength) + currentString;
    }
  }
  function base64encode(encodedString) {
    return Buffer.from(encodedString).toString("base64");
  }

  // To generate a 64 bytes base64 string, source string should be 48
  const maxSourceStringLength = 48;

  // A blob can have a maximum of 100,000 uncommitted blocks at any given time
  const maxBlockIndexLength = 6;

  const maxAllowedBlockIDPrefixLength =
    maxSourceStringLength - maxBlockIndexLength;

  if (blockIDPrefix.length > maxAllowedBlockIDPrefixLength) {
    blockIDPrefix = blockIDPrefix.slice(0, maxAllowedBlockIDPrefixLength);
  }
  const res =
    blockIDPrefix +
    padStart(blockIndex, maxSourceStringLength - blockIDPrefix.length, "0");
  return base64encode(res);
}

const generateUniqueFileName = (originalName) => {
  const identifier = Math.random().toString().replace(/0\./, "");
  return `${originalName}-${identifier}`;
};

export async function POST(request) {
  const formData = await request.formData();
  const file = new Uint8Array(await formData.get("file").arrayBuffer());
  const fileName = formData.get("fileName");
  const totalChunks = +formData.get("totalChunks");
  const [blobName, seq] = fileName.split("_");
  try {
    if (!blockBlobClient) {
      uniqueBlobName = generateUniqueFileName(blobName);
      blockBlobClient = container.getBlockBlobClient(uniqueBlobName);
    }
    const blockId = generateBlockID(fileName, seq);
    await blockBlobClient.stageBlock(blockId, file, file.byteLength);
    if (!blockIds) {
      blockIds = new Array(totalChunks);
    }
    console.log(`UPLOAD FILE POST: uploaded chunk ${fileName} successfully`);
    blockIds[+seq] = blockId;
    count++;
    if (count === totalChunks) {
      await blockBlobClient.commitBlockList(blockIds);
      console.log(`UPLOAD FILE POST: committed blob ${blobName} successfully`);
      blockBlobClient = null;
      blockIds = null;
      count = 0;
      uniqueBlobName = null;
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
    { message: "success", numUploadedChunks: count, fileNameInAzure: uniqueBlobName},
    { status: 200 }
  );
}
