"use client";

import styles from "./page.module.css";
import { encrypt, decrypt } from "@tphan32/data-transfer";
import uploadFile from "./actions/upload";
import downloadFile from "./actions/download";
import React, { useState } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [pass, setPass] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileNameToDownload, setFileNameToDownload] = useState("");

  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleOnClick = () => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(selectedFile);
    reader.onload = function () {
      encrypt(reader.result).then(async ({ encrypted, pass }) => {
        setPass(pass);
        console.log("redirecting to server for uploading file");
        const fileName = await uploadFile(encrypted, selectedFile.name);
        // console.log("file uploaded", fileName);
        setFileName(fileName);
        // fetch("/api/upload", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({ encrypted, fileName: selectedFile.name }),
        // })
      });
    };
  };

  const handleEnterFileName = (event) => {
    setFileNameToDownload(event.target.value);
  }

  const handleEnterPass = (event) => {
    setPass(event.target.value);
  }

  const handleDownload = () => {
    console.log("redirecting to server for downloading file");
    const download = async () => {
      const {data} = await downloadFile(fileNameToDownload);
      // console.log("file downloaded", data);
      if (data) {
        decrypt(data, pass).then((decrypted) => {
          const blob = new Blob([decrypted], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileNameToDownload;
          a.click();
          // console.log("decrypted ne", decrypted);
          // console.log(new TextDecoder().decode(decrypted));
        });
      }
    }
    download();
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
            accept="image/png, image/jpeg, .txt, .pdf"
            onChange={onFileChange}
          />
          <button onClick={handleOnClick}>Upload</button>
        </div>
        {fileName && (
          <div>
            <p>File Name: {fileName}</p>
            <p>Pass: {pass}</p>
          </div>
        )}
      </section>
      <section className={styles.description}>
          <label htmlFor="text">Enter a file name</label>
          <input type="text" id="name" name="name" onChange={handleEnterFileName}/>
          <input type="text" id="pass" name="pass" onChange={handleEnterPass}/>
          <button onClick={handleDownload}>Download</button>
      </section>
    </main>
  );
}

