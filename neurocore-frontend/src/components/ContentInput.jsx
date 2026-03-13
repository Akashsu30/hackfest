import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import mammoth from "mammoth";

const API = "";

const PLACEHOLDER = `Paste your text here... 

For example: "The sun is a giant ball of hot gas at the center of our solar system. It gives us light and warmth every day..."`;

const ContentInput = ({ onContentTransformed, userId, chunkSize }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // ---------------------------
  // Submit Text to Backend
  // ---------------------------
  const handleSubmit = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const sessionRes = await fetch(`${API}/api/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, userId, chunkSize }),
      });

      if (!sessionRes.ok) throw new Error("Failed to start session");

      const session = await sessionRes.json();

      const transformRes = await fetch(`${API}/api/content/transform`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!transformRes.ok) throw new Error("Failed to transform content");

      const data = await transformRes.json();

      // ── AI Pipeline Debug Logs ─────────────────────────────
      if (data.chunks?.length) {
        console.group(
          "%c[NEUROCORE] LLM Transform Response",
          "color:#ff7043;font-weight:bold"
        );

        console.group("Cleaned Chunks");
        data.chunks.forEach((c) =>
          console.log(`Chunk ${c.chunk_id}: ${c.original_text}`)
        );
        console.groupEnd();

        console.group("Simplified Text");
        data.chunks.forEach((c) =>
          console.log(`Chunk ${c.chunk_id}: ${c.simplified_text}`)
        );
        console.groupEnd();

        console.group("Complex Words");
        data.chunks.forEach((c) => {
          if (c.complex_words?.length) {
            console.group(`Chunk ${c.chunk_id}`);
            c.complex_words.forEach((w) =>
              console.log(`${w.word} — ${w.meaning}`)
            );
            console.groupEnd();
          }
        });
        console.groupEnd();

        console.groupEnd();
      } else {
        console.log(
          "[NEUROCORE] Regex fallback used — no LLM chunk data.",
          data
        );
      }
      // ─────────────────────────────────────────────────────

      onContentTransformed({ ...data, sessionId: session._id });
    } catch (err) {
      setError(
        err.message ||
          "Oops! Something went wrong. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // File Extraction Functions
  // ---------------------------

  const extractTxt = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result.replace(/\r?\n\s*\r?\n/g, "\n\n"));
      };

      reader.onerror = () => reject("Failed to read TXT file.");

      reader.readAsText(file);
    });
  };

  const extractPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();

    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);

      const content = await page.getTextContent();

      const pageText = content.items.map((item) => item.str).join(" ");

      text += pageText + "\n\n";
    }

    return text.trim();
  };

  const extractDocx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.extractRawText({ arrayBuffer });

    return result.value.replace(/\r?\n\s*\r?\n/g, "\n\n");
  };

  // ---------------------------
  // Handle File Upload
  // ---------------------------

  const handleFileUpload = async (e) => {
    setError(null);

    const file = e.target.files[0];

    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    const sizeKB = file.size / 1024;
    const sizeMB = file.size / (1024 * 1024);

    if (sizeKB < 10 || sizeMB > 50) {
      setError("File size must be between 10KB and 50MB.");
      return;
    }

    if (!["pdf", "txt", "docx"].includes(ext)) {
      setError("Unsupported file format. Only PDF, TXT, DOCX allowed.");
      return;
    }

    setUploading(true);

    try {
      let extracted = "";

      if (ext === "txt") extracted = await extractTxt(file);
      else if (ext === "pdf") extracted = await extractPdf(file);
      else if (ext === "docx") extracted = await extractDocx(file);

      setText(extracted);
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : "Failed to extract file content."
      );
    } finally {
      setUploading(false);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const charCount = text.length;
  const wordCount = text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

  return (
    <div className="input-card">

      <div className="input-header">
        <span className="input-label">📝 PASTE YOUR TEXT</span>

        <h2>What would you like to read today?</h2>

        <p className="input-hint">
          Textbooks, stories, articles — anything you need to read!
          NeuroCore will make it easier for you. 🌟
        </p>
      </div>

      <textarea
        className="content-textarea"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
      />

      {/* Upload Button */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <button
          className="upload-btn"
          title="Upload PDF, TXT, DOCX"
          onClick={triggerFilePicker}
          style={{
            background: "var(--surface2)",
            border: "2px solid var(--accent)",
            borderRadius: "50%",
            width: 48,
            height: 48,
            fontSize: "2rem",
            color: "var(--accent)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />

        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Upload PDF, TXT, DOCX (10KB–50MB)
        </span>
      </div>

      {/* Upload Loader */}
      {uploading && (
        <div className="upload-overlay">
          <div className="upload-spinner" />
          <div style={{ marginTop: 16 }}>
            Extracting text…
          </div>
        </div>
      )}

      {error && (
        <div className="error-msg">
          <span>😕</span>
          <span>{error}</span>
        </div>
      )}

      <div className="input-footer">
        <span className="char-count">
          {charCount > 0
            ? `${wordCount} words · ${charCount} chars`
            : "Type or paste your text above"}
        </span>

        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="transform-btn"
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" />
              Getting ready… 🧠
            </span>
          ) : (
            "🚀 Let's Read!"
          )}
        </button>
      </div>

    </div>
  );
};

export default ContentInput;