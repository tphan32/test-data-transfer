"use client";

import styles from "./page.module.css";
import { encrypt, decrypt } from "@tphan32/data-transfer";
import uploadFile from "./actions/upload";
import downloadFile from "./actions/download";
import React, { useEffect, useState, useRef } from "react";
// import { socket } from "./socket";
import { getProgress } from "./actions/progress";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pass, setPass] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileNameToDownload, setFileNameToDownload] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleOnClick = () => {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(selectedFile);
    fileReader.onload = (e) => {
      setIsUploading(true);
      setProgress(0);
      const arrayBuffer = e.target.result;
      encrypt(arrayBuffer).then(async ({ encrypted, pass }) => {
        const formData = new FormData();
        const blob = new File([encrypted], selectedFile.name);
        formData.append("file", blob);
        formData.append("fileName", selectedFile.name);
        console.log("redirecting to server for uploading file");
        const name = await uploadFile(formData);
        setFileName(name);
        setPass(pass);
      });
    };

    // const fileReader = new FileReader();
    // fileReader.readAsArrayBuffer(selectedFile);
    // fileReader.onload = (e) => {
    //   const arrayBuffer = e.target.result;
    //   encrypt(arrayBuffer).then(async ({ encrypted, pass }) => {
    //     const formData = new FormData();
    //     const blob = new File([encrypted], selectedFile.name);
    //     formData.append("file", blob);
    //     formData.append("fileName", selectedFile.name);
    //     // socket.emit("hello", {socketId: socket.id});
    //     socket.emit("room", {socketId: socket.id});
    //     console.log("redirecting to server for uploading file");
    //     fetch("/api/upload", {
    //       method: "POST",
    //       body: formData,
    //     });

    //     // const name = await uploadFile(formData);
    //     // setFileName(name);
    //     setPass(pass);
    //   });
    // };
  };

  const handleEnterFileName = (event) => {
    setFileNameToDownload(event.target.value.trim());
  };

  const handleEnterPass = (event) => {
    setPass(event.target.value.trim());
  };

  const handleDownload = () => {
    console.log("redirecting to server for downloading file");
    const download = async () => {
      // const data = await downloadFile(fileNameToDownload);
      setIsDownloading(true);
      setProgress(0);
      const response = await fetch("/api/download", {
        method: "POST",
        body: JSON.stringify({ fileName: fileNameToDownload }),
      });
      const rawData = await response.arrayBuffer();
      decrypt(rawData, pass).then((decrypted) => {
        const blob = new Blob([decrypted], {
          type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileNameToDownload;
        a.click();
      });
      // if (data) {
      //   decrypt(data, pass).then((decrypted) => {
      //     const blob = new Blob([decrypted], {
      //       type: "application/octet-stream",
      //     });
      //     const url = URL.createObjectURL(blob);
      //     const a = document.createElement("a");
      //     a.href = url;
      //     a.download = fileNameToDownload;
      //     a.click();
      //     // console.log("decrypted ne", decrypted);
      //     // console.log(new TextDecoder().decode(decrypted));
      //   });
      // }
    };
    download();
  };

  if (isUploading) {
    window.onbeforeunload = (e) => {
      if (isUploading && !fileName) {
        const dialogText = "Are you sure you want to leave?";
        e.preventDefault();
        e.returnValue = dialogText;
        return dialogText;
      }
    };
  }

  if (isUploading && Math.abs(progress - 100) < 0.001 && timerRef.current) {
    console.log("clearing interval");
    clearInterval(timerRef.current);
    setIsUploading(false);
    timerRef.current = null;
  }

  useEffect(() => {
    if (isUploading && fileName) {
      const callGetProgress = async () => {
        const data = await getProgress(fileName, "upload");
        if (data?.loadedBytes) {
          const currentProgress = (data.loadedBytes / selectedFile.size) * 100;
          if (currentProgress > 100) {
            setProgress(100);
          } else {
            setProgress(currentProgress);
          }
        }
      };
      const timer = setInterval(() => {
        callGetProgress();
      }, 2000);

      timerRef.current = timer;
      return () => {
        clearInterval(timer);
      };
    }
  }, [isUploading, fileName]);

  if(isDownloading && Math.abs(progress - 100) < 0.001 && timerRef.current) {
    console.log("clearing interval");
    clearInterval(timerRef.current);
    setIsDownloading(false);
    timerRef.current = null;
  }

  useEffect(() => {
    if (isDownloading && fileNameToDownload) {
      const callGetProgress = async () => {
        const data = await getProgress(fileNameToDownload, "download");
        // console.log("calling get progress for downloading", fileNameToDownload);

        if (data?.loadedBytes) {
          const currentProgress = (data.loadedBytes / selectedFile.size) * 100;
          if (currentProgress > 100) {
            setProgress(100);
          } else {
            setProgress(currentProgress);
          }
        }
      };
      const timer = setInterval(() => {
        callGetProgress();
      }, 2000);

      timerRef.current = timer;
      return () => {
        clearInterval(timer);
      };
    }
  }, [isDownloading, fileNameToDownload]);

  // useEffect(() => {
  //   console.log("socket id", socket);
  //   socket.on("progress", (data) => {
  //     console.log("socket client side", data);
  //     // socket.emit("uploadFileServer", {message: "received"});
  //   });
  // }, [socket])

  return (
    <main className={styles.main}>
      <section className={styles.description}>
        <div>
          <label htmlFor="image">Choose a file</label>
          <input
            type="file"
            id="file"
            name="file"
            accept="image/png, image/jpeg, .txt, .pdf"
            onChange={onFileChange}
          />
          <button onClick={handleOnClick} style={{ border: "2px solid red" }}>
            Upload
          </button>
        </div>
        {fileName && (
          <div>
            <p>File Name: {fileName}</p>
            <p>Pass: {pass}</p>
          </div>
        )}
      </section>
      <div className="w-full bg-neutral-200 dark:bg-neutral-600">
        <div
          className="bg-cyan-500 p-0.5 text-center text-xs font-medium leading-none text-slate-50"
          style={{
            width: `${progress.toFixed(0)}%`,
            transition: "width 3s ease",
          }}
        >
          {progress.toFixed(2)}%
        </div>
      </div>
      <section className={styles.description}>
        <label htmlFor="text">Enter a file name</label>
        <input
          type="text"
          id="name"
          name="name"
          onChange={handleEnterFileName}
          style={{ border: "2px solid red" }}
        />
        <label htmlFor="text">Enter pass</label>
        <input
          type="text"
          id="pass"
          name="pass"
          onChange={handleEnterPass}
          style={{ border: "2px solid red" }}
        />
        <button onClick={handleDownload} style={{ border: "2px solid red" }}>
          Download
        </button>
      </section>
    </main>
  );
}

