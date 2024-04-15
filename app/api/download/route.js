import { NextResponse } from "next/server";
import { azureUploadInfo, SASToken } from "@/app/data/storage";

export async function POST(request) {
  const { filename } = await request.json();
  console.log("filename", filename);
  const { container } = azureUploadInfo;
  let downloadUrl;
  try {
    const blockBlobClient = container.getBlockBlobClient(filename);
    if (!blockBlobClient.url) {
      return NextResponse.json({ error: "NO FILE FOUND" }, { status: 404 });
    }
    downloadUrl = `${blockBlobClient.url}?${SASToken}`;
  } catch (e) {
    console.error("error", e);
    return NextResponse.json({ error: e }, { status: 500 });
  }

  return NextResponse.json({ url: downloadUrl }, { status: 200 });
}
