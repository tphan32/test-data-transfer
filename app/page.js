"use client";

import styles from "./page.module.css";
import React, { useEffect, useState, useRef } from "react";
import {
  generateIV,
  generateKey,
  generatePass,
  encrypt,
  decrypt,
} from "./utils/cryptoInBrowser";

const chunkSize = 4 * 1024 * 1024; // 4 MB

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pass, setPass] = useState(null);
  const [displayFileName, setDisplayFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleOnClick = () => {
    if (!selectedFile) {
      return;
    }
    setIsUploading(true);
    setProgress(0);

    const handleEncryptAndUploadFile = async () => {
      const numberChunks = Math.ceil(selectedFile.size / chunkSize);
      const iv = generateIV();
      const key = await generateKey();

      const encryptAndUploadByChunk = (cryptoInfo, uploadInfo) => {
        const { iv, key } = cryptoInfo;
        const { file, fileName, from, to, seq, total } = uploadInfo;
        const fileReader = new FileReader();
        const chunk = file.slice(from, to);
        fileReader.readAsArrayBuffer(chunk);
        fileReader.onload = async (e) => {
          if (e.target.error === null) {
            try {
              const encrypted = await encrypt(e.target.result, key, iv);
              // const blob = new Blob([encrypted]);
              const blob = new Blob([e.target.result]);
              const formData = new FormData();
              formData.append("file", blob);
              formData.append("fileName", `${fileName}_${seq}`);
              formData.append("totalChunks", total);
              console.log("redirecting to server for uploading file");
              const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });
              if (!res.ok) {
                setIsUploading(false);
                setError("Error uploading file");
              } else {
                const data = await res.json();
                const { numUploadedChunks, fileNameInAzure } = data;
                setProgress((numUploadedChunks / total) * 100);
                if (fileNameInAzure && !displayFileName) {
                  setDisplayFileName(fileNameInAzure);
                  setPass(generatePass(iv, key));
                }
              }
            } catch (err) {
              console.error("encryptAndUploadByChunk ERROR: ", err);
            }
          }
        };
      };

      for (let i = 0; i < numberChunks; i++) {
        encryptAndUploadByChunk(
          {
            iv,
            key,
          },
          {
            file: selectedFile,
            fileName: selectedFile.name,
            from: i * chunkSize,
            to: (i + 1) * chunkSize,
            seq: i,
            total: numberChunks,
          }
        );
      }
    };
    handleEncryptAndUploadFile();
    setIsUploading(false);
  };

  if (isUploading) {
    window.onbeforeunload = (e) => {
      const dialogText = "Are you sure you want to leave?";
      e.preventDefault();
      e.returnValue = dialogText;
      return dialogText;
    };
  }

  return (
    <main className={styles.main}>
      <section className={styles.description}>
        <div>
          <label htmlFor="image">Choose a file</label>
          <input
            type="file"
            id="file"
            name="file"
            accept="image/png, image/jpeg, .txt, .pdf, mp4"
            onChange={onFileChange}
          />
          <button onClick={handleOnClick} style={{ border: "2px solid red" }}>
            Upload
          </button>
        </div>
        {displayFileName && (
          <div>
            <p>File Name: {displayFileName}</p>
            <p>Pass: {pass}</p>
          </div>
        )}
        {error && <p>{error}</p>}
      </section>
      <div className="w-full bg-neutral-200 dark:bg-neutral-600">
        <div
          className="bg-cyan-500 p-0.5 text-center text-xs font-medium leading-none text-slate-50"
          style={{
            width: `${progress.toFixed(0)}%`,
            transition: "width 2s ease",
          }}
        >
          {progress.toFixed(2)}%
        </div>
      </div>
    </main>
  );
}

