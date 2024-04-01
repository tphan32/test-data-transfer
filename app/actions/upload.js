"use server";
import { uploadFileToAzure } from "@tphan32/data-transfer";
// import { headers } from 'next/headers';
// import io from 'socket.io-client';
// import { socket } from "../socket";

// const headerList = headers();
// const pathname = headerList.get("referer");
// const socket = io('http://localhost:3000');

// console.log("socket id", socket);
import fs from "fs";

const onProgress = (fileName, ev) => {
  // console.log("socket existing?", socket);
  // console.log("onProgress sending data", {...ev, fileName});
  // progress.upload[fileName] = {...ev, fileName};
  // const progress = {
  //   upload: {
  //     fileName: { ...ev, fileName },
  //   },
  // };
  fs.writeFileSync(
    "progress.json",
    JSON.stringify({
      upload: {
        [fileName]: { ...ev, fileName },
      },
    })
  );
};

export default async function uploadFile(formData) {
  const fileName = formData.get("fileName");
  const file = await formData.get("file").arrayBuffer();
  console.log("uploadFile in backend");
  const name = uploadFileToAzure(file, fileName, { onProgress });
  return name;
}
