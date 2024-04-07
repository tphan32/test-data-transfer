"use client";

import styles from "../page.module.css";
import React, { useEffect, useState, useMemo } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

const chunkSize = 128 * 1024 * 1024; // 128 MB

export default function Home() {
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

    setDisplayFileName("");
    setIsUploading(true);

    const handleUploadFile = async () => {
      const numberChunks = Math.ceil(selectedFile.size / chunkSize);

      const uploadFileByChunks = (uploadInfo) => {
        const { file, fileName, from, to, seq, total } = uploadInfo;
        const fileReader = new FileReader();
        const chunk = file.slice(from, to);
        fileReader.readAsArrayBuffer(chunk);
        fileReader.onload = async (e) => {
          if (e.target.error === null) {
            try {
              const blob = new Blob([e.target.result]);
              const formData = new FormData();
              formData.append("file", blob);
              formData.append("fileName", `${seq}#_#${fileName}`);
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
                const currentProgress = (numUploadedChunks / total) * 100;
                const updatedFiles = Object.assign({}, uppy.getState().files);
                const updatedFile = Object.assign(
                  {},
                  updatedFiles[uppyState.id],
                  {
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
                  }
                );
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
                }
              }
            } catch (err) {
              console.error("uploadFileByChunks ERROR: ", err);
            }
          }
        };
      };

      for (let i = 0; i < numberChunks; i++) {
        uploadFileByChunks(
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
    handleUploadFile();
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
      uppy.reset();
      window.onbeforeunload = null;
    };
  }, []);

  return (
    <main className={styles.main}>
      <h1>Insecure Azure Data Transfer</h1>
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
        </section>
      )}
      {error && <p>{error}</p>}
    </main>
  );
}

