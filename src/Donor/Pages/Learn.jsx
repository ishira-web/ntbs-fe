// src/pages/Learn.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Clock, ChevronDown, ChevronUp, Play, ArrowRight } from "lucide-react";

// If your API is on another origin, set this to e.g. "http://localhost:5000"
const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

function Learn() {
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  // Fetched from backend
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        // Pull the latest 9 blogs (adjust as you like)
        const res = await fetch(`${API_BASE}/api/blogs?page=1&limit=9`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
        if (isMounted) setPosts(json?.data || []);
      } catch (e) {
        if (isMounted) setErr(e.message || "Failed to load articles");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  const faqs = [
    { question: "How often can I donate blood?", answer: "You can donate whole blood every 56 days (8 weeks)." },
    { question: "Will donating blood make me weak?", answer: "Most people feel fine. Hydrate and avoid heavy exercise for the rest of the day." },
    { question: "What should I do before donating blood?", answer: "Eat a healthy meal, hydrate, sleep well, and avoid fatty foods right before." },
    { question: "How long does the entire process take?", answer: "Typically 45–60 minutes; the actual draw takes ~8–10 minutes." },
    { question: "Is it safe to donate blood?", answer: "Yes. Single-use sterile equipment is used for every donor." },
  ];

  const bloodTypes = [
    { type: "A+", donors: ["A+", "A-", "O+", "O-"], recipients: ["A+", "AB+"] },
    { type: "A-", donors: ["A-", "O-"], recipients: ["A+", "A-", "AB+", "AB-"] },
    { type: "B+", donors: ["B+", "B-", "O+", "O-"], recipients: ["B+", "AB+"] },
    { type: "B-", donors: ["B-", "O-"], recipients: ["B+", "B-", "AB+", "AB-"] },
    { type: "AB+", donors: ["All blood types"], recipients: ["AB+"] },
    { type: "AB-", donors: ["AB-", "A-", "B-", "O-"], recipients: ["AB+", "AB-"] },
    { type: "O+", donors: ["O+", "O-"], recipients: ["O+", "A+", "B+", "AB+"] },
    { type: "O-", donors: ["O-"], recipients: ["All blood types"] },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-red-700 to-red-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <BookOpen size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blood Donation Education Hub</h1>
            <p className="text-xl text-white/90 mb-8">
              Everything you need to know about blood donation, from preparation to process and beyond.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#posts" className="bg-white text-red-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Read Articles
              </a>
              <a href="#faq" className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
                View FAQs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section id="posts" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:4xl font-bold text-gray-900 mb-4">Educational Resources</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore our collection of articles to learn more about blood donation and its impact.
            </p>
          </div>

          {err && (
            <div className="max-w-2xl mx-auto mb-6 text-center text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {err}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_,i)=>(
                <div key={i} className="bg-white rounded-xl shadow-md animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-xl"/>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-3"/>
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"/>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"/>
                    <div className="h-4 bg-gray-200 rounded w-5/6"/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.length === 0 && (
                <div className="col-span-full text-center text-gray-600">
                  No articles yet. Please check back soon.
                </div>
              )}

              {posts.map((post) => (
                <article key={post._id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <Link to={`/learn/${post._id}`} className="block h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                    />
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                        {post.type}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock size={14} className="mr-1" /> {post.readingTime ? `${post.readingTime} min read` : "—"}
                      </span>
                    </div>
                    <Link to={`/learn/${post._id}`}>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:underline">{post.title}</h3>
                    </Link>
                    <p className="text-gray-600 mb-4">{post.description}</p>
                    <Link to={`/learn/${post._id}`} className="text-red-700 font-medium inline-flex items-center hover:text-red-800 transition-colors">
                      Read more <ArrowRight size={16} className="ml-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Blood Types */}
      <section className="py-16 md:py-24 bg-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Blood Type Compatibility</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Understanding which blood types can donate to and receive from others.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bloodTypes.map((bloodType) => (
                <div key={bloodType.type} className="border border-gray-200 rounded-xl p-4 text-center">
                  <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xl font-bold mb-3">
                    {bloodType.type}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Can donate to:</h3>
                  <p className="text-sm text-gray-600 mb-3">{bloodType.recipients.join(", ")}</p>
                  <h3 className="font-semibold text-gray-900 mb-2">Can receive from:</h3>
                  <p className="text-sm text-gray-600">{bloodType.donors.join(", ")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    {/* Videos (with embedded YouTube) */}
<section className="py-16 md:py-24">
  <div className="container mx-auto px-4 md:px-6">
    <div className="text-center mb-12 md:mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Video Resources</h2>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto">
        Watch these informative videos to learn more about the blood donation process.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  {/* Video 1 */}
  <div className="rounded-xl overflow-hidden aspect-video relative">
    <iframe
      className="w-full h-full"
      src="https://www.youtube.com/embed/jmhiHKsEUXU"
      title="The Blood Donation Process"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    ></iframe>
  </div>

  {/* Video 2 */}
  <div className="rounded-xl overflow-hidden aspect-video relative">
    <iframe
      className="w-full h-full"
      src="https://www.youtube.com/embed/kOISEM6L4xk"
      title="Why Your Donation Matters"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    ></iframe>
  </div>
</div>

  </div>
</section>


      {/* FAQs */}
      <section id="faq" className="py-16 md:py-24 bg-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about blood donation.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                <button className="w-full flex items-center justify-between p-6 text-left" onClick={() => toggleFaq(index)}>
                  <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                  {openFaq === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-red-700 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
        <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Now that you've learned about blood donation, take the next step and schedule your donation appointment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/donate" className="bg-white text-red-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Schedule Donation
            </Link>
            <Link to="/campaigns" className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
              Find a Blood Drive
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Learn;
