// ==========================================
// FIREBASE
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyBEwLV6WDvMkzuQ-ugOBm2S2YZqQ6Pp0PM",
  authDomain: "ritika-e71b7.firebaseapp.com",
  projectId: "ritika-e71b7",
  storageBucket: "ritika-e71b7.firebasestorage.app",
  messagingSenderId: "152583560780",
  appId: "1:152583560780:web:ffd19a64736cf16790dee9",
  measurementId: "G-9SVQ2585C9"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// ==========================================
// CLOUDINARY
// ==========================================

const CLOUDINARY_CLOUD_NAME = "iiyugxww";
const CLOUDINARY_UPLOAD_PRESET = "ritika-files";


// ==========================================
// ELEMENTS
// ==========================================

const fileInput = document.getElementById("fileInput");
const chooseBtn = document.getElementById("chooseBtn");
const fileList = document.getElementById("fileList");
const emptyState = document.getElementById("emptyState");
const fileCount = document.getElementById("fileCount");

const uploadCard = document.querySelector(".upload-card");

const progressBox = document.getElementById("progressBox");
const uploadStatus = document.getElementById("uploadStatus");
const progressPercent = document.getElementById("progressPercent");
const progressBar = document.getElementById("progressBar");


// ==========================================
// LOCAL FILE STATE
// ==========================================

let files = [];


// ==========================================
// CHOOSE FILES
// ==========================================

chooseBtn.addEventListener("click", () => {
  fileInput.click();
});


// ==========================================
// FILE INPUT
// ==========================================

fileInput.addEventListener("change", (event) => {

  const selectedFiles = [...event.target.files];

  uploadFiles(selectedFiles);

  // Allow selecting the same file again later
  fileInput.value = "";

});


// ==========================================
// DRAG & DROP
// ==========================================

uploadCard.addEventListener("dragover", (event) => {

  event.preventDefault();

  uploadCard.classList.add("dragging");

});


uploadCard.addEventListener("dragleave", () => {

  uploadCard.classList.remove("dragging");

});


uploadCard.addEventListener("drop", (event) => {

  event.preventDefault();

  uploadCard.classList.remove("dragging");

  const droppedFiles = [...event.dataTransfer.files];

  uploadFiles(droppedFiles);

});


// ==========================================
// UPLOAD MULTIPLE FILES
// ==========================================

async function uploadFiles(newFiles) {

  if (!newFiles.length) {
    return;
  }

  progressBox.classList.remove("hidden");

  chooseBtn.disabled = true;

  try {

    for (let i = 0; i < newFiles.length; i++) {

      const file = newFiles[i];

      uploadStatus.textContent =
        `Uploading ${i + 1} of ${newFiles.length}...`;

      progressPercent.textContent = "0%";

      progressBar.style.width = "0%";


      // Upload to Cloudinary
      const uploadedFile = await uploadToCloudinary(file);


      // Save file information to Firestore
      await saveFileToFirestore(file, uploadedFile);


      // Update percentage
      const percent = Math.round(
        ((i + 1) / newFiles.length) * 100
      );

      progressPercent.textContent = `${percent}%`;
      progressBar.style.width = `${percent}%`;

    }


    uploadStatus.textContent = "Upload complete!";
    progressPercent.textContent = "100%";
    progressBar.style.width = "100%";


    // Reload files from Firestore
    await loadFiles();


    setTimeout(() => {

      progressBox.classList.add("hidden");

      progressBar.style.width = "0%";
      progressPercent.textContent = "0%";

    }, 1200);


  } catch (error) {

    console.error("Upload error:", error);

    uploadStatus.textContent = "Upload failed";

    progressPercent.textContent = "Error";

    progressBar.style.width = "0%";

    alert(
      "Something went wrong while uploading the file.\n\n" +
      error.message
    );

  } finally {

    chooseBtn.disabled = false;

  }

}


// ==========================================
// CLOUDINARY UPLOAD
// ==========================================

function uploadToCloudinary(file) {

  return new Promise((resolve, reject) => {

    const url =
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
      "upload_preset",
      CLOUDINARY_UPLOAD_PRESET
    );


    const xhr = new XMLHttpRequest();

    xhr.open("POST", url);


    // Upload progress
    xhr.upload.addEventListener("progress", (event) => {

      if (event.lengthComputable) {

        const percent = Math.round(
          (event.loaded / event.total) * 100
        );

        progressPercent.textContent = `${percent}%`;

        progressBar.style.width = `${percent}%`;

      }

    });


    xhr.onload = () => {

      if (xhr.status >= 200 && xhr.status < 300) {

        try {

          const response = JSON.parse(xhr.responseText);

          resolve(response);

        } catch (error) {

          reject(
            new Error("Invalid Cloudinary response.")
          );

        }

      } else {

        reject(
          new Error(
            `Cloudinary upload failed (${xhr.status}).`
          )
        );

      }

    };


    xhr.onerror = () => {

      reject(
        new Error("Network error while uploading.")
      );

    };


    xhr.send(formData);

  });

}


// ==========================================
// SAVE FILE TO FIRESTORE
// ==========================================

async function saveFileToFirestore(file, cloudinaryData) {

  await addDoc(
    collection(db, "files"),
    {

      name: file.name,

      size: file.size,

      type: file.type || "application/octet-stream",

      url: cloudinaryData.secure_url,

      publicId: cloudinaryData.public_id,

      resourceType: cloudinaryData.resource_type,

      format: cloudinaryData.format || null,

      createdAt: serverTimestamp()

    }
  );

}


// ==========================================
// LOAD FILES FROM FIRESTORE
// ==========================================

async function loadFiles() {

  try {

    const filesQuery = query(
      collection(db, "files"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(filesQuery);

    files = [];


    snapshot.forEach((doc) => {

      const data = doc.data();

      files.push({

        id: doc.id,

        name: data.name,

        size: data.size,

        type: data.type,

        url: data.url,

        publicId: data.publicId,

        resourceType: data.resourceType,

        format: data.format,

        createdAt: data.createdAt

      });

    });


    renderFiles();

  } catch (error) {

    console.error(
      "Error loading files:",
      error
    );

    console.error(
      "If this is the first run, check your Firestore rules/index."
    );

  }

}


// ==========================================
// RENDER FILES
// ==========================================

function renderFiles() {

  fileList.innerHTML = "";

  fileCount.textContent = files.length;


  if (files.length === 0) {

    fileList.appendChild(createEmptyState());

    return;

  }


  files.forEach((file) => {

    const card = document.createElement("div");

    card.className = "file-card";


    // -------------------------------
    // ICON
    // -------------------------------

    const icon = document.createElement("div");

    icon.className = "file-icon";

    icon.textContent = getFileIcon(file.name);


    // -------------------------------
    // INFO
    // -------------------------------

    const info = document.createElement("div");

    info.className = "file-info";


    const name = document.createElement("div");

    name.className = "file-name";

    name.textContent = file.name;


    const size = document.createElement("div");

    size.className = "file-size";

    size.textContent = formatSize(file.size);


    info.appendChild(name);

    info.appendChild(size);


    // -------------------------------
    // DOWNLOAD BUTTON
    // -------------------------------

    const download = document.createElement("button");

    download.className = "download-btn";

    download.textContent = "↓";

    download.title = "Download";


    download.addEventListener("click", () => {

      downloadFile(file);

    });


    // -------------------------------
    // CARD
    // -------------------------------

    card.appendChild(icon);

    card.appendChild(info);

    card.appendChild(download);


    fileList.appendChild(card);

  });

}


// ==========================================
// EMPTY STATE
// ==========================================

function createEmptyState() {

  const div = document.createElement("div");

  div.className = "empty-state";

  div.innerHTML = `
    <div>♡</div>
    <p>Nothing here yet, Ritika.</p>
    <small>Upload something and it'll appear here.</small>
  `;

  return div;

}


// ==========================================
// DOWNLOAD FILE
// ==========================================

function downloadFile(file) {

  if (!file.url) {

    alert("File URL not found.");

    return;

  }


  const link = document.createElement("a");

  link.href = file.url;

  link.target = "_blank";

  link.rel = "noopener noreferrer";

  link.download = file.name;


  document.body.appendChild(link);

  link.click();

  link.remove();

}


// ==========================================
// FORMAT FILE SIZE
// ==========================================

function formatSize(bytes) {

  if (!bytes) {
    return "0 B";
  }


  if (bytes < 1024) {

    return `${bytes} B`;

  }


  if (bytes < 1024 * 1024) {

    return `${(bytes / 1024).toFixed(1)} KB`;

  }


  if (bytes < 1024 * 1024 * 1024) {

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  }


  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;

}


// ==========================================
// FILE ICON
// ==========================================

function getFileIcon(name) {

  const ext =
    name.split(".").pop().toLowerCase();


  if (
    ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
  ) {

    return "🖼️";

  }


  if (
    ["mp4", "mov", "avi", "mkv"].includes(ext)
  ) {

    return "🎬";

  }


  if (
    ["mp3", "wav", "m4a"].includes(ext)
  ) {

    return "🎵";

  }


  if (
    ["zip", "rar", "7z"].includes(ext)
  ) {

    return "📦";

  }


  if (["pdf"].includes(ext)) {

    return "📕";

  }


  if (
    ["doc", "docx"].includes(ext)
  ) {

    return "📘";

  }


  return "📄";

}


// ==========================================
// INITIAL LOAD
// ==========================================

loadFiles();
