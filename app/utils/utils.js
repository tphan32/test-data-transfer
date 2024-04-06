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

export { generateBlockID, generateUniqueFileName };