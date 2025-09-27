// src/pages/ManageBlogs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

const API_BASE = "http://localhost:5000"; // e.g., "http://localhost:5000" or leave empty if same origin
const TYPES = ["Tech", "Lifestyle", "Education", "Health", "Travel"];

/* ---------------------------- Reusable UI ---------------------------- */
function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

function ImageThumb({ src, alt }) {
  if (!src) return <div style={styles.thumbPlaceholder}>—</div>;
  return <img src={src} alt={alt || "blog"} style={styles.thumb} />;
}

/* ---------------------------- Main Page ----------------------------- */
export default function ManageBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Create/Edit modal state
  const emptyForm = { title: "", description: "", content: "", type: "", readingTime: "", image: null };
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState("");
  const [editId, setEditId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const toDelete = useMemo(() => blogs.find(b => b._id === deleteId), [blogs, deleteId]);

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q, typeFilter]);

  async function fetchBlogs() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("limit", limit);
      if (q) params.set("q", q);
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`${API_BASE}/api/blogs?` + params.toString());
      if (!res.ok) throw new Error(`Failed to load blogs (${res.status})`);
      const json = await res.json();
      setBlogs(json?.data || []);
      setPages(json?.pagination?.pages || 1);
    } catch (err) {
      toast.error(err.message || "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setPreview("");
    setEditId(null);
    setFormOpen(true);
  }

  function openEdit(blog) {
    setForm({
      title: blog.title || "",
      description: blog.description || "",
      content: blog.content || "",
      type: blog.type || "",
      readingTime: blog.readingTime ?? "",
      image: null, // new upload optional
    });
    setPreview(blog.image || "");
    setEditId(blog._id);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSubmitting(false);
    setForm(emptyForm);
    setPreview("");
    setEditId(null);
  }

  function onChange(e) {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files?.[0];
      setForm((f) => ({ ...f, image: file || null }));
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPreview("");
      }
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function buildFormData(data) {
    const fd = new FormData();
    const appendIf = (key, val) => {
      if (val !== undefined && val !== null && val !== "") fd.append(key, val);
    };
    appendIf("title", data.title);
    appendIf("description", data.description);
    appendIf("content", data.content);
    appendIf("type", data.type);
    if (data.readingTime !== "" && !Number.isNaN(Number(data.readingTime))) {
      fd.append("readingTime", Number(data.readingTime));
    }
    if (data.image instanceof File) {
      fd.append("image", data.image);
    }
    return fd;
  }

  async function submitForm(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Basic required checks for create
      if (!editId) {
        const required = ["title", "description", "content", "type", "readingTime"];
        for (const k of required) {
          if (!form[k] && form[k] !== 0) throw new Error(`Please fill the ${k} field`);
        }
      }
      if (form.type && !TYPES.includes(form.type)) {
        throw new Error(`Type must be one of: ${TYPES.join(", ")}`);
      }

      const fd = buildFormData(form);
      const res = await fetch(
        `${API_BASE}/api/blogs${editId ? `/${editId}` : ""}`,
        { method: editId ? "PUT" : "POST", body: fd }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to save blog");

      toast.success(editId ? "Blog updated ✅" : "Blog created 🎉");
      closeForm();
      if (!editId) setPage(1);
      await fetchBlogs();
    } catch (err) {
      toast.error(err.message || "Error saving blog");
      setSubmitting(false);
    }
  }

  function openDelete(id) {
    setDeleteId(id);
    setDeleteOpen(true);
  }
  function closeDelete() {
    setDeleteOpen(false);
    setDeleteId(null);
  }

  async function confirmDelete() {
    try {
      const res = await fetch(`${API_BASE}/api/blogs/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to delete");

      toast.success("Blog deleted 🗑️");
      closeDelete();
      if (blogs.length === 1 && page > 1) setPage((p) => p - 1);
      await fetchBlogs();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  }

  return (
    <div style={styles.wrap}>
      {/* Local Toaster (you can move this to App root if preferred) */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <div style={styles.headerRow}>
        <h2 style={{ margin: 0 }}>Manage Blogs</h2>
        <div>
          <button style={styles.primaryBtn} onClick={openCreate}>+ New Blog</button>
        </div>
      </div>

      <div style={styles.filters}>
        <input
          placeholder="Search title/description/content…"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          style={styles.input}
        />
        <select
          value={typeFilter}
          onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}
          style={styles.input}
        >
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={limit}
          onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
          style={styles.input}
        >
          {[5,10,20,50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 16 }}>Loading…</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Image</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Reading</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th} />
              </tr>
            </thead>
            <tbody>
              {blogs.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#777" }}>No blogs found</td></tr>
              )}
              {blogs.map(b => (
                <tr key={b._id}>
                  <td style={styles.td}><ImageThumb src={b.image} alt={b.title} /></td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{b.title}</div>
                    <div style={{ color: "#666", fontSize: 13, marginTop: 4, maxWidth: 480, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {b.description}
                    </div>
                  </td>
                  <td style={styles.td}>{b.type}</td>
                  <td style={styles.td}>{b.readingTime ? `${b.readingTime} min` : "—"}</td>
                  <td style={styles.td}>{b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <button style={styles.iconBtn} onClick={() => openEdit(b)}>Edit</button>
                    <button style={{ ...styles.iconBtn, color: "#c0392b" }} onClick={() => openDelete(b._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={styles.pagination}>
            <button
              style={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ‹ Prev
            </button>
            <span style={{ margin: "0 8px" }}>
              Page {page} of {pages}
            </span>
            <button
              style={styles.pageBtn}
              disabled={page >= pages}
              onClick={() => setPage(p => Math.min(pages, p + 1))}
            >
              Next ›
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={formOpen} onClose={closeForm} title={editId ? "Edit Blog" : "New Blog"}>
        <form onSubmit={submitForm}>
          <div style={styles.formRow}>
            <label style={styles.label}>Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              style={styles.input}
              placeholder="Enter title"
              required={!editId}
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              style={{ ...styles.input, minHeight: 64 }}
              placeholder="Short summary"
              required={!editId}
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label}>Content *</label>
            <textarea
              name="content"
              value={form.content}
              onChange={onChange}
              style={{ ...styles.input, minHeight: 120 }}
              placeholder="Full content (markdown or HTML)"
              required={!editId}
            />
          </div>
          <div style={styles.grid2}>
            <div style={styles.formRow}>
              <label style={styles.label}>Type *</label>
              <select
                name="type"
                value={form.type}
                onChange={onChange}
                style={styles.input}
                required={!editId}
              >
                <option value="">Select type</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Reading Time (min) *</label>
              <input
                name="readingTime"
                type="number"
                min={1}
                value={form.readingTime}
                onChange={onChange}
                style={styles.input}
                placeholder="e.g. 6"
                required={!editId}
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <label style={styles.label}>Image</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={onChange}
              style={styles.input}
            />
            {preview && (
              <div style={{ marginTop: 8 }}>
                <img src={preview} alt="preview" style={{ maxWidth: 200, borderRadius: 8, border: "1px solid #eee" }} />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
            <button type="button" style={styles.secondaryBtn} onClick={closeForm}>Cancel</button>
            <button type="submit" style={styles.primaryBtn} disabled={submitting}>
              {submitting ? "Saving…" : (editId ? "Save Changes" : "Create Blog")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete modal */}
      <Modal open={deleteOpen} onClose={closeDelete} title="Delete Blog">
        <p>Are you sure you want to delete:</p>
        <p style={{ fontWeight: 600 }}>{toDelete?.title || "this blog"}?</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button style={styles.secondaryBtn} onClick={closeDelete}>Cancel</button>
          <button style={{ ...styles.primaryBtn, background: "#c0392b" }} onClick={confirmDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------ Styles ------------------------------ */
const styles = {
  wrap: { padding: 16, maxWidth: 1200, margin: "0 auto" },
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  filters: { display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" },
  input: {
    border: "1px solid #dcdcdc",
    borderRadius: 8,
    padding: "10px 12px",
    minWidth: 180,
    outline: "none",
  },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  th: { textAlign: "left", padding: 12, borderBottom: "1px solid #eee", fontWeight: 600, fontSize: 14, background: "#fafafa" },
  td: { padding: 12, borderBottom: "1px solid #f2f2f2", verticalAlign: "middle", fontSize: 14 },
  thumb: { width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" },
  thumbPlaceholder: { width: 64, height: 64, borderRadius: 8, background: "#f5f5f5", display: "grid", placeItems: "center", color: "#999", fontSize: 12, border: "1px solid #eee" },
  iconBtn: {
    border: "1px solid #e1e1e1",
    background: "#fff",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
    marginLeft: 6,
  },
  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryBtn: {
    background: "#f4f4f5",
    color: "#111",
    border: "1px solid #e4e4e7",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  pagination: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: 12 },
  pageBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
    minWidth: 80,
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  formRow: { marginTop: 10, display: "flex", flexDirection: "column" },
  label: { fontSize: 13, color: "#444", marginBottom: 6 },
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "grid", placeItems: "center", padding: 16, zIndex: 1000,
  },
  modal: {
    width: "min(720px, 100%)", background: "#fff", borderRadius: 12, padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between" },
};
