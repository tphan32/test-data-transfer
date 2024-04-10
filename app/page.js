"use client";

import styles from "./page.module.css";
import React, { useEffect, useState, useMemo } from "react";
import {
  generateIV,
  generateKey,
  generatePass,
  encrypt,
  decrypt,
} from "./utils/cryptoInBrowser";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import streamSaver from "streamsaver";

const chunkSize = 3 * 1024 * 1024; // 4 MB

export default function Home() {
  const [pass, setPass] = useState(null);
  const [displayFileName, setDisplayFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const uppy = useMemo(() => {
    return new Uppy({
      restrictions: { maxNumberOfFiles: 1 },
      autoProceed: false,
    });
  }, []);

  const handleOnClick = (uppyState) => {
    const selectedFile = uppyState.data;

    setPass(null);
    setDisplayFileName("");
    setIsUploading(true);
    const updatedFiles = Object.assign({}, uppy.getState().files);

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
              const blob = new Blob([encrypted]);
              console.log("encrypted", encrypted, encrypted.byteLength);
              const formData = new FormData();
              formData.append("file", blob);
              formData.append("fileName", `${seq}#_#${fileName}`);
              formData.append("totalChunks", total);
              console.log("redirecting to server for uploading file");

              let updatedFile;
              if (seq === 0) {
                updatedFile = Object.assign({}, updatedFiles[uppyState.id], {
                  progress: Object.assign(
                    {},
                    updatedFiles[uppyState.id].progress,
                    {
                      uploadComplete: false,
                      uploadStarted: true,
                      percentage: 0,
                      bytesUploaded: 0,
                    }
                  ),
                });
                updatedFiles[uppyState.id] = updatedFile;
                uppy.setState({ files: updatedFiles });
              }

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
                const currentProgress = (numUploadedChunks / total) * 100;
                updatedFile = Object.assign({}, updatedFiles[uppyState.id], {
                  progress: Object.assign(
                    {},
                    updatedFiles[uppyState.id].progress,
                    {
                      uploadComplete: currentProgress === 100,
                      uploadStarted: true,
                      percentage: currentProgress,
                      bytesUploaded:
                        (numUploadedChunks * chunkSize) % selectedFile.size,
                    }
                  ),
                });
                updatedFiles[uppyState.id] = updatedFile;
                uppy.setState({ files: updatedFiles });
                if (
                  document.getElementsByClassName(
                    "uppy-StatusBar-statusPrimary"
                  ).length > 0
                ) {
                  document.getElementsByClassName(
                    "uppy-StatusBar-statusPrimary"
                  )[0].innerHTML = `Uploading ${currentProgress.toFixed(2)}%`;
                }
                if (
                  document.getElementsByClassName("uppy-StatusBar-progress")
                    .length > 0
                ) {
                  document.getElementsByClassName(
                    "uppy-StatusBar-progress"
                  )[0].style.width = `${currentProgress}%`;
                }
                if (currentProgress === 100) {
                  document.getElementsByClassName(
                    "uppy-DashboardContent-back"
                  )[0].innerHTML = "Done";
                }

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
      setIsUploading(false);
    };
    handleEncryptAndUploadFile();
  };

  if (isUploading) {
    window.onbeforeunload = (e) => {
      const dialogText = "Are you sure you want to leave?";
      e.preventDefault();
      e.returnValue = dialogText;
      return dialogText;
    };
  }

  useEffect(() => {
    uppy.on("file-added", (file) => {
      uppy.reset();
      uppy.addFile(file);
    });

    uppy.on("upload", (filesState) => {
      if (filesState.fileIDs.length === 0) {
        setError("Please select a file");
        return;
      }
      const uppyFile = uppy.getFile(filesState.fileIDs[0]);
      handleOnClick(uppyFile);
    });

    uppy.off("complete", null).on("complete", (result) => {});

    return () => {
      uppy.close();
      window.onbeforeunload = null;
    };
  }, []);

  const handleDownload = () => {
    const fileStream = streamSaver.createWriteStream("filename");

    let buffer = [];
    let len = 0;
    const chunkSizeAndEncryptTag = chunkSize + 16;

    fetch(url).then((res) => {
      const writer = fileStream.getWriter();
      const reader = res.body.getReader();

      const pump = async () => {
        const { value, done } = await reader.read();
        if (done) {
          console.log("done");
          let flatBuffer;
          if (len > 0) {
            // console.log("buffer in done", buffer, len);
            flatBuffer = new Uint8Array(len);
            let offset = 0;
            for (const chunk of buffer) {
              flatBuffer.set(chunk, offset);
              offset += chunk.length;
            }
            const decrypted = await decrypt(new Uint8Array(flatBuffer), pass);
            writer.write(decrypted);
            // console.log("flatBuffer in done", flatBuffer, len);
            // writer.write(new Uint8Array(flatBuffer));
          }
          writer.close();
          return;
        }
        buffer.push(value);
        len += value.length;
        let flatBuffer;
        // console.log("flatBuffer", flatBuffer, len, chunkSize);
        if (len >= chunkSizeAndEncryptTag) {
          flatBuffer = new Uint8Array(len);
          let offset = 0;
          for (const chunk of buffer) {
            flatBuffer.set(chunk, offset);
            offset += chunk.length;
          }
          buffer = [];
        }
        while (len >= chunkSizeAndEncryptTag) {
          const chunk = new Uint8Array(
            flatBuffer.slice(0, chunkSizeAndEncryptTag)
          );
          flatBuffer = flatBuffer.slice(chunkSizeAndEncryptTag);
          len -= chunkSizeAndEncryptTag;
          // console.log("chunk", chunk.byteLength, chunk);
          // console.log("flatBuffer", flatBuffer.byteLength, len);

          const decrypted = await decrypt(chunk, pass);
          writer.write(decrypted);

          // writer.write(chunk);
          if (len < chunkSizeAndEncryptTag && len > 0) {
            buffer = [flatBuffer];
            // console.log("buffer in while loop", buffer, flatBuffer);
          }
        }
        // console.log("flatBuffer", flatBuffer.byteLength, len);
        writer.ready.then(pump);
      };
      pump();
    });
  };

  return (
    <main className={styles.main}>
      <h1>End-to-end Encryption Azure Data Transfer</h1>
      <section className={styles.description}>
        <div>
          <Dashboard
            id="uppy"
            uppy={uppy}
            name="Upload File To Azure"
            placeholder="Upload File To Azure"
            proudlyDisplayPoweredByUppy={false}
            allowMultipleUploads={false}
            showProgressDetails={true}
          />
        </div>
      </section>
      {displayFileName && (
        <section>
          <p>File Name: {displayFileName}</p>
          <p>Pass: {pass}</p>
        </section>
      )}
      {error && <p>{error}</p>}
      <section className={styles.description}>
        <button
          className="rounded-full bg-slate-600 w-24 h-8 text-slate-100"
          onClick={handleDownload}
        >
          Download
        </button>
      </section>
    </main>
  );
}

