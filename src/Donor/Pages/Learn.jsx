import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  BookOpen,
  Droplet,
  Shield,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Play
} from 'lucide-react';

function Learn() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const educationalPosts = [
    {
      id: 1,
      title: "The Blood Donation Process: What to Expect",
      excerpt: "Learn about each step of the donation process from registration to post-donation care.",
      image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1000&auto=format&fit=crop",
      readTime: "5 min read",
      category: "Process"
    },
    {
      id: 2,
      title: "Blood Types and Compatibility",
      excerpt: "Understanding different blood types and which types can donate to and receive from others.",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1000&auto=format&fit=crop",
      readTime: "7 min read",
      category: "Science"
    },
    {
      id: 3,
      title: "Preparing for Your Donation",
      excerpt: "Tips on how to prepare yourself physically and mentally before donating blood.",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?q=80&w=1000&auto=format&fit=crop",
      readTime: "4 min read",
      category: "Preparation"
    },
    {
      id: 4,
      title: "Myths and Facts About Blood Donation",
      excerpt: "Debunking common misconceptions and providing factual information about blood donation.",
      image: "https://images.unsplash.com/photo-1576702335870-6df5c50f3a77?q=80&w=1000&auto=format&fit=crop",
      readTime: "6 min read",
      category: "Education"
    },
    {
      id: 5,
      title: "The Journey of Donated Blood",
      excerpt: "Follow the path of donated blood from collection to transfusion to a patient in need.",
      image: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=1000&auto=format&fit=crop",
      readTime: "8 min read",
      category: "Process"
    },
    {
      id: 6,
      title: "Health Benefits of Blood Donation",
      excerpt: "Discover how regular blood donation can benefit your own health and wellbeing.",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=1000&auto=format&fit=crop",
      readTime: "5 min read",
      category: "Health"
    }
  ];

  const faqs = [
    {
      question: "How often can I donate blood?",
      answer: "You can donate whole blood every 56 days (8 weeks). This allows your body enough time to replenish the blood cells lost during donation."
    },
    {
      question: "Will donating blood make me weak?",
      answer: "Most people feel completely fine after donating blood. Your body replaces the fluid within 24 hours and red blood cells within 4-6 weeks. You might be advised to avoid strenuous exercise for the rest of the day."
    },
    {
      question: "What should I do before donating blood?",
      answer: "Eat a healthy meal and drink plenty of fluids before your donation. Make sure to get a good night's sleep and avoid fatty foods right before donating."
    },
    {
      question: "How long does the entire process take?",
      answer: "The entire process—from registration to refreshments—typically takes about 45 minutes to an hour. The actual blood donation only takes 8-10 minutes."
    },
    {
      question: "Is it safe to donate blood?",
      answer: "Yes, donating blood is very safe. New, sterile disposable equipment is used for each donor, so there's no risk of contracting any disease."
    }
  ];

  const bloodTypes = [
    { type: "A+", donors: ["A+", "A-", "O+", "O-"], recipients: ["A+", "AB+"] },
    { type: "A-", donors: ["A-", "O-"], recipients: ["A+", "A-", "AB+", "AB-"] },
    { type: "B+", donors: ["B+", "B-", "O+", "O-"], recipients: ["B+", "AB+"] },
    { type: "B-", donors: ["B-", "O-"], recipients: ["B+", "B-", "AB+", "AB-"] },
    { type: "AB+", donors: ["All blood types"], recipients: ["AB+"] },
    { type: "AB-", donors: ["AB-", "A-", "B-", "O-"], recipients: ["AB+", "AB-"] },
    { type: "O+", donors: ["O+", "O-"], recipients: ["O+", "A+", "B+", "AB+"] },
    { type: "O-", donors: ["O-"], recipients: ["All blood types"] }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
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

      {/* Featured Posts */}
      <section id="posts" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Educational Resources</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore our collection of articles to learn more about blood donation and its impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {educationalPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock size={14} className="mr-1" /> {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <button className="text-red-700 font-medium flex items-center hover:text-red-800 transition-colors">
                    Read more <ArrowRight size={16} className="ml-1" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Blood Types Compatibility */}
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
                  <p className="text-sm text-gray-600 mb-3">{bloodType.recipients.join(', ')}</p>
                  <h3 className="font-semibold text-gray-900 mb-2">Can receive from:</h3>
                  <p className="text-sm text-gray-600">{bloodType.donors.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video Resources */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Video Resources</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Watch these informative videos to learn more about the blood donation process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center">
                <button className="bg-red-600 text-white rounded-full p-4 hover:bg-red-700 transition-colors">
                  <Play size={32} fill="white" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-semibold mb-2">The Blood Donation Process</h3>
                <p className="text-white/80">A step-by-step guide to what happens during donation</p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center">
                <button className="bg-red-600 text-white rounded-full p-4 hover:bg-red-700 transition-colors">
                  <Play size={32} fill="white" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-semibold mb-2">Why Your Donation Matters</h3>
                <p className="text-white/80">The impact of your donation on patients' lives</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
                <button
                  className="w-full flex items-center justify-between p-6 text-left"
                  onClick={() => toggleFaq(index)}
                >
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

      {/* Call to Action */}
      <section className="py-16 md:py-24 bg-red-700 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Now that you've learned about blood donation, take the next step and schedule your donation appointment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/donate"
              className="bg-white text-red-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Schedule Donation
            </Link>
            <Link
              to="/campaigns"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Find a Blood Drive
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Learn;