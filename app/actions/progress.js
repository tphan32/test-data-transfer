"use server";

import fs from "fs";

export const getProgress = (fileName, processType) => {
  try {
    const data = JSON.parse(fs.readFileSync("progress.json"));
    if (data && data[processType] && data[processType][fileName]) {
      return data[processType][fileName];
    }
  } catch {
    return {loadedBytes: 0, fileName}
  }
};