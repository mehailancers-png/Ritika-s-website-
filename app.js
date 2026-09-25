const fileInput = document.getElementById("fileInput");
const chooseBtn = document.getElementById("chooseBtn");
const fileList = document.getElementById("fileList");
const emptyState = document.getElementById("emptyState");
const fileCount = document.getElementById("fileCount");

const uploadCard = document.querySelector(".upload-card");

let files = [];

chooseBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (event) => {
  addFiles([...event.target.files]);
});

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

  addFiles(droppedFiles);
});

function addFiles(newFiles) {

  newFiles.forEach(file => {

    const exists = files.some(
      existing => existing.name === file.name &&
                  existing.size === file.size
    );

    if (!exists) {
      files.push(file);
    }

  });

  renderFiles();
}

function renderFiles() {

  fileList.innerHTML = "";

  fileCount.textContent = files.length;

  if (files.length === 0) {

    fileList.appendChild(createEmptyState());

    return;
  }

  files.forEach((file, index) => {

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
      downloadFile(file);
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

function downloadFile(file) {

  const url = URL.createObjectURL(file);

  const link = document.createElement("a");

  link.href = url;
  link.download = file.name;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}

function formatSize(bytes) {

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

  const ext = name.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return "🖼️";
  }

  if (["mp4", "mov", "avi", "mkv"].includes(ext)) {
    return "🎬";
  }

  if (["mp3", "wav", "m4a"].includes(ext)) {
    return "🎵";
  }

  if (["zip", "rar", "7z"].includes(ext)) {
    return "📦";
  }

  if (["pdf"].includes(ext)) {
    return "📕";
  }

  if (["doc", "docx"].includes(ext)) {
    return "📘";
  }

  return "📄";
}

renderFiles();
