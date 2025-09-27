// src/pages/LearnArticle.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
// If your API is elsewhere, use VITE_API_BASE like in Learn.jsx
const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

// OPTIONAL (only if you store HTML in `content` and want sanitization):
// npm i dompurify
// import DOMPurify from "dompurify";

export default function LearnArticle() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/blogs/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
        if (alive) setBlog(json?.data || null);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load article");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 py-16">
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse mb-6" />
          <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-10" />
          <div className="space-y-3">
            {[...Array(6)].map((_,i)=><div key={i} className="h-4 bg-gray-200 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (err || !blog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Article not found</h1>
          <p className="text-gray-600 mb-8">{err || "The article you’re looking for doesn’t exist."}</p>
          <Link to="/learn" className="text-red-700 font-medium hover:underline">← Back to Learn</Link>
        </div>
      </div>
    );
  }

  const safeTextBlocks = (blog.content || "").trim().split(/\n\s*\n/);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero image */}
      {blog.image ? (
        <div className="w-full h-64 md:h-80 bg-gray-200 overflow-hidden">
          <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
        </div>
      ) : <div className="w-full h-24 bg-gray-100" />}

      <div className="container mx-auto px-4 md:px-6 py-10 md:py-16">
        <div className="max-w-3xl mx-auto">
          <Link to="/learn" className="text-red-700 font-medium hover:underline">← Back to Learn</Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">{blog.title}</h1>

          <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">{blog.type}</span>
            <span>•</span>
            <span>{blog.readingTime ? `${blog.readingTime} min read` : "—"}</span>
          </div>

          <div className="prose max-w-none mt-8">
            {safeTextBlocks.map((block, i) => (
              <p key={i} className="text-gray-800 leading-7 whitespace-pre-wrap">{block}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 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