import { useRef, useState } from "react";
import { useToast } from "../context/ToastContext";

// ─── validation constants ─────────────────────────────────────────────────────
const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
  "image/svg+xml",
  "image/x-bmp",
  "image/x-png",
]);

// Extension fallback for files where the browser doesn't set a MIME type
const ACCEPTED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif",
  ".bmp", ".tiff", ".tif", ".heic", ".heif", ".svg",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── types ────────────────────────────────────────────────────────────────────
type UploadStatus = "waiting" | "uploading" | "done" | "error";

interface QueuedFile {
  id: string;
  file: File;
  progress: number;   // 0 – 100
  status: UploadStatus;
}

// Used locally in addFiles — not stored in state (toasts handle display)
interface RejectedFile {
  name: string;
  reason: string;
}

// ─── status badge config ──────────────────────────────────────────────────────
const statusLabel: Record<UploadStatus, string> = {
  waiting:   "Waiting",
  uploading: "Uploading…",
  done:      "Done",
  error:     "Error",
};

const statusColor: Record<UploadStatus, string> = {
  waiting:   "bg-secondary",
  uploading: "bg-primary",
  done:      "bg-success",
  error:     "bg-danger",
};

const progressBarColor: Record<UploadStatus, string> = {
  waiting:   "bg-secondary",
  uploading: "bg-primary progress-bar-striped progress-bar-animated",
  done:      "bg-success",
  error:     "bg-danger",
};

// ─── helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── component ───────────────────────────────────────────────────────────────
const FileDropTile = () => {
  const { addToast }                = useToast();
  const [queue, setQueue]           = useState<QueuedFile[]>([]);
  const [dragging, setDragging]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const inputRef                    = useRef<HTMLInputElement>(null);

  // ── validate & add files ───────────────────────────────────────────────────
  const validate = (f: File): string | null => {
    const mime = f.type.toLowerCase();
    const ext  = "." + f.name.split(".").pop()?.toLowerCase();

    const isImage =
      ACCEPTED_TYPES.has(mime) ||
      (mime === "" && ACCEPTED_EXTENSIONS.has(ext));   // MIME missing — use ext

    if (!isImage) {
      // Distinguish "completely wrong type" from "image but unsupported format"
      if (mime.startsWith("image/")) {
        return `Unsupported image format (${ext || mime})`;
      }
      return "Not a photo — only image files are accepted";
    }

    if (f.size > MAX_FILE_SIZE) {
      return `Exceeds ${MAX_FILE_SIZE / (1024 * 1024)} MB size limit`;
    }

    return null; // valid
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;

    const newValid: QueuedFile[] = [];
    const rejected: RejectedFile[] = [];

    Array.from(incoming).forEach((f) => {
      const reason = validate(f);
      if (reason) {
        rejected.push({ name: f.name, reason });
      } else {
        newValid.push({ id: uid(), file: f, progress: 0, status: "waiting" });
      }
    });

    if (newValid.length) setQueue((prev) => [...prev, ...newValid]);

    // Fire one toast per rejected file
    rejected.forEach((r) =>
      addToast(`${r.name} — ${r.reason}`, "warning")
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    setQueue((prev) => prev.filter((qf) => qf.id !== id));
  };

  // ── per-file mock upload ───────────────────────────────────────────────────
  // Replace the body of this function with a real XMLHttpRequest when the
  // backend is ready — XHR exposes xhr.upload.onprogress for live progress.
  //
  //   const xhr = new XMLHttpRequest();
  //   xhr.upload.onprogress = (e) => {
  //     if (e.lengthComputable) {
  //       const pct = Math.round((e.loaded / e.total) * 100);
  //       updateProgress(id, pct, "uploading");
  //     }
  //   };
  //   xhr.onload  = () => updateProgress(id, 100, "done");
  //   xhr.onerror = () => updateProgress(id, 0,   "error");
  //   xhr.open("POST", "/api/uploads");
  //   const fd = new FormData();
  //   fd.append("file", file);
  //   xhr.send(fd);
  const simulateUpload = (id: string): Promise<void> =>
    new Promise((resolve) => {
      let progress = 0;
      const tick = setInterval(() => {
        progress += Math.floor(Math.random() * 18) + 6; // +6–24% per tick
        if (progress >= 100) {
          clearInterval(tick);
          setQueue((prev) =>
            prev.map((qf) =>
              qf.id === id ? { ...qf, progress: 100, status: "done" } : qf
            )
          );
          resolve();
        } else {
          setQueue((prev) =>
            prev.map((qf) =>
              qf.id === id ? { ...qf, progress, status: "uploading" } : qf
            )
          );
        }
      }, 160);
    });

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!queue.length || loading) return;
    setLoading(true);

    // Mark all as uploading immediately
    setQueue((prev) => prev.map((qf) => ({ ...qf, status: "uploading" })));

    // Upload all files in parallel
    await Promise.all(queue.map((qf) => simulateUpload(qf.id)));

    const count = queue.length;
    setLoading(false);
    addToast(
      `${count} file${count > 1 ? "s" : ""} uploaded successfully`,
      "success"
    );
  };

  const handleClear = () => {
    setQueue([]);
  };

  const waitingCount   = queue.filter((qf) => qf.status === "waiting").length;
  const uploadingCount = queue.filter((qf) => qf.status === "uploading").length;
  const doneCount      = queue.filter((qf) => qf.status === "done").length;

  return (
    <div className="card h-100 shadow-sm">
      <div className="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
        <span>Upload Files</span>
        {loading && uploadingCount > 0 && (
          <small className="text-primary fw-normal">
            Uploading {uploadingCount} file{uploadingCount > 1 ? "s" : ""}…
          </small>
        )}
        {!loading && doneCount > 0 && doneCount === queue.length && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary fw-normal"
            onClick={handleClear}
          >
            Clear
          </button>
        )}
        {!loading && queue.length > 0 && doneCount < queue.length && (
          <small className="text-muted fw-normal">
            {doneCount}/{queue.length} done
          </small>
        )}
      </div>

      <div className="card-body d-flex flex-column gap-3">

        {/* ── Drop zone ──────────────────────────────────────────────────── */}
        <div
          role="button"
          tabIndex={0}
          className={`rounded-3 d-flex flex-column align-items-center justify-content-center p-4 text-center ${
            dragging
              ? "bg-light border border-dark border-2"
              : "border border-secondary"
          } ${loading ? "opacity-50 pe-none" : ""}`}
          style={{ minHeight: "140px", borderStyle: "dashed", cursor: loading ? "default" : "pointer" }}
          onDragOver={(e) => { if (!loading) { e.preventDefault(); setDragging(true); } }}
          onDragLeave={() => setDragging(false)}
          onDrop={loading ? undefined : handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
          onKeyDown={(e) => !loading && e.key === "Enter" && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={[...ACCEPTED_TYPES].join(",")}
            multiple
            className="d-none"
            onChange={(e) => addFiles(e.target.files)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor"
            className="text-secondary mb-2" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708z" />
            <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383" />
          </svg>
          <p className="mb-0 fw-medium">
            {dragging ? "Release to drop" : "Drag & drop images here"}
          </p>
          <small className="text-muted">
            PNG, JPG, WEBP, GIF, BMP, TIFF, HEIC · max 10 MB
          </small>
        </div>

        {/* ── File queue with progress bars ──────────────────────────────── */}
        {queue.length > 0 && (
          <ul className="list-group">
            {queue.map((qf) => (
              <li key={qf.id} className="list-group-item px-3 py-2">

                {/* Top row: name + size + status badge + remove */}
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex flex-column overflow-hidden me-2" style={{ minWidth: 0 }}>
                    <span className="text-truncate fw-medium small">{qf.file.name}</span>
                    <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                      {formatBytes(qf.file.size)}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <span className={`badge ${statusColor[qf.status]}`} style={{ fontSize: "0.7rem" }}>
                      {statusLabel[qf.status]}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0 px-1"
                      style={{ fontSize: "0.75rem", lineHeight: "1.4" }}
                      disabled={qf.status === "uploading"}
                      onClick={() => handleRemove(qf.id)}
                      aria-label={`Remove ${qf.file.name}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress" style={{ height: "6px" }}>
                  <div
                    className={`progress-bar ${progressBarColor[qf.status]}`}
                    role="progressbar"
                    style={{ width: `${qf.progress}%`, transition: "width 0.15s ease" }}
                    aria-valuenow={qf.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>

              </li>
            ))}
          </ul>
        )}

        {/* ── Submit button ──────────────────────────────────────────────── */}
        <button
          type="button"
          className="btn btn-dark mt-auto"
          disabled={!waitingCount && !loading || loading}
          onClick={handleSubmit}
        >
          {loading
            ? `Uploading… (${doneCount}/${queue.length})`
            : waitingCount > 0
            ? `Submit ${waitingCount} file${waitingCount > 1 ? "s" : ""}`
            : "Submit"}
        </button>

      </div>
    </div>
  );
};

export default FileDropTile;
