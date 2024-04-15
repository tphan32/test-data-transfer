const ALGORITHM = "AES-CBC";

const rawDataToHex = (buffer) => {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
};

const hexToRawData = (hex) => {
  return new Uint8Array(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
};

const convertToUint8Array = (data) => {
  if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
    return data;
  } else {
    return new Uint8Array(data);
  }
};

export async function generateKey() {
  return await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: 128,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export function generateIV() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export async function generatePass(iv, cryptoKey) {
  return (
    rawDataToHex(iv) +
    "." +
    rawDataToHex(await crypto.subtle.exportKey("raw", cryptoKey))
  );
}

export async function encrypt(data, key, iv) {
  const dataInUint8Array = convertToUint8Array(data);

  return await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    dataInUint8Array
  );
}

export async function decrypt(encryptedData, pass) {
  try {
    const dataInUint8Array = convertToUint8Array(encryptedData);

    const [ivHex, keyHex] = pass.split(".");
    const iv = hexToRawData(ivHex);
    const rawKey = hexToRawData(keyHex);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: ALGORITHM, length: 128 },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      cryptoKey,
      dataInUint8Array
    );
    return new Uint8Array(decrypted);
  } catch (e) {
    const error = new Error(e);
    console.log("Error decrypting data: ", error.stack, error.message);
    throw error;
  }
}
