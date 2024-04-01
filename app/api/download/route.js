import { downloadFileFromAzure } from "@tphan32/data-transfer";
import { NextResponse } from "next/server";

import fs from "fs";

const onProgress = (fileName, ev) => {
  // progress.download[fileName] = { ...ev, fileName };
  // console.log("downloading onProgress sending data", progress);
  fs.writeFileSync(
    "progress.json",
    JSON.stringify({
      download: {
        [fileName]: { ...ev, fileName },
      },
    })
  );
  // progress[fileName] = { ...ev, fileName };
  // console.log("downloading onProgress sending data", progress);
};

export async function POST(request) {
  const { fileName } = await request.json();
  console.log("fileName", fileName);
  const file = await downloadFileFromAzure(fileName, { onProgress });
  return new NextResponse(new Blob([file]), { status: 200 });
}
