import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================
   FIREBASE
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyBEwLV6WDmVkzuQ-ugOBm2S2YZqQ6Pp0PM",
  authDomain: "ritika-e71b7.firebaseapp.com",
  projectId: "ritika-e71b7",
  storageBucket: "ritika-e71b7.firebasestorage.app",
  messagingSenderId: "152583560780",
  appId: "1:152583560780:web:ffd19a64736cf16790dee9",
  measurementId: "G-9SVQ2585C9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/* =========================
   CLOUDINARY
========================= */

const CLOUDINARY_CLOUD_NAME = "iiyugxww";
const CLOUDINARY_UPLOAD_PRESET = "ritika-files";


/* =========================
   FILE ELEMENTS
========================= */

const fileInput = document.getElementById("fileInput");
const chooseBtn = document.getElementById("chooseBtn");
const fileList = document.getElementById("fileList");
const fileCount = document.getElementById("fileCount");

const uploadCard = document.querySelector(".upload-card");

const progressBox = document.getElementById("progressBox");
const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");
const uploadStatus = document.getElementById("uploadStatus");


/* =========================
   FILE UPLOAD
========================= */

chooseBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", event => {
  uploadFiles([...event.target.files]);

  fileInput.value = "";
});


uploadCard.addEventListener("dragover", event => {
  event.preventDefault();
  uploadCard.classList.add("dragging");
});


uploadCard.addEventListener("dragleave", () => {
  uploadCard.classList.remove("dragging");
});


uploadCard.addEventListener("drop", event => {
  event.preventDefault();

  uploadCard.classList.remove("dragging");

  uploadFiles([...event.dataTransfer.files]);
});


async function uploadFiles(files) {

  if (!files.length) return;

  progressBox.classList.remove("hidden");

  for (const file of files) {

    try {

      await uploadFile(file);

    } catch (error) {

      console.error(error);

      uploadStatus.textContent = "Upload failed";
      progressPercent.textContent = "Error";

      alert(
        `Could not upload "${file.name}".\n\n${error.message}`
      );
    }
  }

  setTimeout(() => {
    progressBox.classList.add("hidden");
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";
  }, 1200);
}


function uploadFile(file) {

  return new Promise((resolve, reject) => {

    const xhr = new XMLHttpRequest();

    const url =
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);


    xhr.open("POST", url);


    xhr.upload.addEventListener("progress", event => {

      if (!event.lengthComputable) return;

      const percent =
        Math.round((event.loaded / event.total) * 100);

      progressBar.style.width = `${percent}%`;
      progressPercent.textContent = `${percent}%`;
      uploadStatus.textContent = `Uploading ${file.name}...`;
    });


    xhr.onload = async () => {

      if (xhr.status >= 200 && xhr.status < 300) {

        try {

          const result = JSON.parse(xhr.responseText);

          await addDoc(collection(db, "files"), {

            name: file.name,
            size: file.size,
            type: file.type,

            url: result.secure_url,
            publicId: result.public_id,

            resourceType: result.resource_type,
            format: result.format,

            createdAt: serverTimestamp()
          });

          uploadStatus.textContent = "Upload complete";

          await loadFiles();

          resolve(result);

        } catch (error) {

          reject(error);
        }

      } else {

        reject(
          new Error(
            `Cloudinary upload failed (${xhr.status}): ${xhr.responseText}`
          )
        );
      }
    };


    xhr.onerror = () => {
      reject(new Error("Network error while uploading."));
    };


    xhr.send(formData);
  });
}


/* =========================
   LOAD FILES
========================= */

async function loadFiles() {

  try {

    const q = query(
      collection(db, "files"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const files = [];

    snapshot.forEach(doc => {

      files.push({
        id: doc.id,
        ...doc.data()
      });

    });

    renderFiles(files);

  } catch (error) {

    console.error("Could not load files:", error);
  }
}


function renderFiles(files) {

  fileList.innerHTML = "";

  fileCount.textContent = files.length;


  if (files.length === 0) {

    fileList.appendChild(createEmptyState());

    return;
  }


  files.forEach(file => {

    const card = document.createElement("div");
    card.className = "file-card";


    const icon = document.createElement("div");
    icon.className = "file-icon";
    icon.textContent = getFileIcon(file.name);


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


    const download = document.createElement("button");

    download.className = "download-btn";
    download.textContent = "↓";
    download.title = "Download";


    download.addEventListener("click", () => {

      window.open(file.url, "_blank");
    });


    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(download);

    fileList.appendChild(card);

  });
}


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


/* =========================
   CHAT
========================= */

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");


chatForm.addEventListener("submit", async event => {

  event.preventDefault();

  const message = messageInput.value.trim();

  if (!message) return;


  messageInput.disabled = true;


  try {

    await addDoc(collection(db, "messages"), {

      text: message,

      createdAt: serverTimestamp(),

      sender: getSenderName()

    });

    messageInput.value = "";

  } catch (error) {

    console.error(error);

    alert("Message could not be sent.");

  } finally {

    messageInput.disabled = false;
    messageInput.focus();
  }
});


/* =========================
   REAL-TIME CHAT
========================= */

function startChatListener() {

  const q = query(
    collection(db, "messages"),
    orderBy("createdAt", "asc")
  );


  onSnapshot(
    q,
    snapshot => {

      const messages = [];

      snapshot.forEach(doc => {

        messages.push({
          id: doc.id,
          ...doc.data()
        });

      });

      renderMessages(messages);

    },

    error => {

      console.error("Chat listener error:", error);
    }
  );
}


function renderMessages(messages) {

  chatMessages.innerHTML = "";


  if (messages.length === 0) {

    const empty = document.createElement("div");

    empty.className = "chat-empty";

    empty.innerHTML = `
      <div>♡</div>
      <p>No messages yet.</p>
      <small>Say something.</small>
    `;

    chatMessages.appendChild(empty);

    return;
  }


  messages.forEach(message => {

    const wrapper = document.createElement("div");

    const sender = message.sender || "";

    const isMe =
      sender === getSenderName();


    wrapper.className =
      `message ${isMe ? "me" : "them"}`;


    const bubble = document.createElement("div");

    bubble.className = "message-bubble";


    const text = document.createElement("div");

    text.className = "message-text";

    text.innerHTML =
      linkify(escapeHTML(message.text || ""));


    const time = document.createElement("div");

    time.className = "message-time";

    time.textContent =
      formatMessageTime(message.createdAt);


    bubble.appendChild(text);
    bubble.appendChild(time);

    wrapper.appendChild(bubble);

    chatMessages.appendChild(wrapper);
  });


  chatMessages.scrollTop =
    chatMessages.scrollHeight;
}


/* =========================
   SIMPLE NAME
========================= */

function getSenderName() {

  let name = localStorage.getItem("ritika_chat_name");


  if (!name) {

    name =
      prompt("Enter your name for the chat:");

    name =
      (name || "Guest").trim().slice(0, 30);

    localStorage.setItem(
      "ritika_chat_name",
      name
    );
  }


  return name;
}


/* =========================
   URL LINKIFY
========================= */

function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}


function linkify(text) {

  const urlRegex =
    /(https?:\/\/[^\s<]+)/g;


  return text.replace(
    urlRegex,

    url => {

      const cleanUrl =
        url.replace(/[.,!?)]$/, "");

      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>`;
    }
  );
}


/* =========================
   TIME
========================= */

function formatMessageTime(timestamp) {

  if (!timestamp) {
    return "Sending...";
  }


  const date =
    timestamp.toDate();


  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}


/* =========================
   FILE HELPERS
========================= */

function formatSize(bytes) {

  if (!bytes) return "0 B";


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


function getFileIcon(name) {

  const ext =
    name.split(".").pop().toLowerCase();


  if (
    ["jpg", "jpeg", "png", "gif", "webp"]
      .includes(ext)
  ) {
    return "🖼️";
  }


  if (
    ["mp4", "mov", "avi", "mkv"]
      .includes(ext)
  ) {
    return "🎬";
  }


  if (
    ["mp3", "wav", "m4a"]
      .includes(ext)
  ) {
    return "🎵";
  }


  if (
    ["zip", "rar", "7z"]
      .includes(ext)
  ) {
    return "📦";
  }


  if (ext === "pdf") {
    return "📕";
  }


  if (
    ["doc", "docx"]
      .includes(ext)
  ) {
    return "📘";
  }


  return "📄";
}


/* =========================
   START
========================= */

loadFiles();
startChatListener();
