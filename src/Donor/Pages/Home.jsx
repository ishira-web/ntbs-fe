// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

gsap.registerPlugin(ScrollTrigger);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const HOME_CAMPS_LIMIT = 3;

const slides = [
  {
    title: "ජීවිත බේරාගැනීමට ඔබේ රුධිරය",
    subtitle: "ඔබගේ කුඩා ඉල්ලීමක් — යමෙක්ගේ පූර්ණ ජීවිතයක්.",
    cta: "රුධිර දානයට එක්වන්න",
    href: "/donate",
    image:
      "https://images.unsplash.com/photo-1697192156499-d85cfe1452c0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "අදම රුධිර දානයට",
    subtitle: "සෞඛ්‍ය අංශයන් සමඟ රක්ත සුරක්ෂිතභාවය වැඩි දියුණු කරමු.",
    cta: "ඉදිරි කඳවුරැ බලන්න",
    href: "/campaigns",
    image:
      "https://images.unsplash.com/photo-1542884841-9f546e727bca?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "රෝගියෙකුට ඔබයි අපේක්ෂාව",
    subtitle: "සහයෝගයෙන් ජීවිත ගොඩනඟමු.",
    cta: "ආයතනික දායකත්වය",
    href: "/hospitals",
    image:
      "https://images.unsplash.com/photo-1676313125237-cacf3e880dc2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const posterUrl = (p) =>
  !p ? null : /^https?:\/\//i.test(p) ? p : `${API_BASE}/${p}`;

export default function Home() {
  const pageRef = useRef(null);
  const swiperRef = useRef(null);
  const [swiperReady, setSwiperReady] = useState(false);

  // --- New: upcoming campaigns state ---
  const [upcoming, setUpcoming] = useState([]);
  const [totalCamps, setTotalCamps] = useState(0);
  const [campLoading, setCampLoading] = useState(true);
  const [campErr, setCampErr] = useState("");

  // Initialize GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade-up reveals
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.from(el, {
          y: 24,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          },
        });
      });

      // Count-up numbers when stats section enters
      const counters = gsap.utils.toArray(".counter");
      counters.forEach((el) => {
        const end = Number(el.getAttribute("data-end") || "0");
        const obj = { val: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.to(obj, {
              val: end,
              duration: 1.4,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = Math.floor(obj.val).toLocaleString("si-LK");
              },
            });
          },
        });
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // Text animation for slider
  useEffect(() => {
    if (!swiperReady) return;
    const swiper = swiperRef.current;

    const handleSlideChange = () => {
      const activeSlide = swiper.slides[swiper.activeIndex];
      const textElements = activeSlide.querySelectorAll(".slide-content > *");

      swiper.slides.forEach((slide) => {
        const content = slide.querySelector(".slide-content");
        if (content) gsap.set(content.children, { opacity: 0, y: 20 });
      });

      gsap.to(textElements, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
      });
    };

    const initialSlide = swiper.slides[swiper.activeIndex];
    const initialTextElements = initialSlide.querySelectorAll(".slide-content > *");
    gsap.set(initialTextElements, { opacity: 0, y: 20 });
    gsap.to(initialTextElements, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power2.out",
      delay: 0.5,
    });

    swiper.on("slideChange", handleSlideChange);
    return () => swiper.off("slideChange", handleSlideChange);
  }, [swiperReady]);

  // --- New: fetch 3 upcoming/planned (fallback to ongoing) ---
  useEffect(() => {
    const load = async () => {
      setCampLoading(true);
      setCampErr("");
      try {
        const withAuth = {};
        const token = localStorage.getItem("auth_token");
        if (token) withAuth.Authorization = `Bearer ${token}`;

        // Try planned first (soonest first)
        const urlPlanned = new URL(`${API_BASE}/api/camps`);
        urlPlanned.searchParams.set("status", "planned");
        urlPlanned.searchParams.set("page", "1");
        urlPlanned.searchParams.set("limit", String(HOME_CAMPS_LIMIT));
        urlPlanned.searchParams.set("sort", "startAt");

        let res = await fetch(urlPlanned.toString(), { headers: withAuth });
        let j = await res.json();
        if (!res.ok) throw new Error(j.message || "Failed to load campaigns");

        let list = j.data ?? j.camps ?? [];
        let total = j.pagination?.total ?? list.length;

        // Fallback: if no planned, show ongoing
        if (list.length === 0) {
          const urlOngoing = new URL(`${API_BASE}/api/camps`);
          urlOngoing.searchParams.set("status", "ongoing");
          urlOngoing.searchParams.set("page", "1");
          urlOngoing.searchParams.set("limit", String(HOME_CAMPS_LIMIT));
          urlOngoing.searchParams.set("sort", "startAt");

          res = await fetch(urlOngoing.toString(), { headers: withAuth });
          j = await res.json();
          if (!res.ok) throw new Error(j.message || "Failed to load campaigns");
          list = j.data ?? j.camps ?? [];
          total = j.pagination?.total ?? list.length;
        }

        setUpcoming(list);
        setTotalCamps(total);
      } catch (e) {
        setCampErr(e.message || "Failed to load campaigns");
      } finally {
        setCampLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main ref={pageRef} className="bg-white">
      {/* Hero Slider */}
      <section className="relative h-[70vh] md:h-[78vh] overflow-hidden">
        <Swiper
          ref={swiperRef}
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect="fade"
          speed={1200}
          loop
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{
            clickable: true,
            el: ".swiper-pagination",
            bulletClass: "swiper-pagination-bullet",
            bulletActiveClass: "swiper-pagination-bullet-active",
            renderBullet: (index, className) => {
              return `<span class="${className} bg-white opacity-50 hover:opacity-75 transition-opacity duration-300"></span>`;
            },
          }}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          className="h-full"
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setSwiperReady(true);
          }}
        >
          {slides.map((s, i) => (
            <SwiperSlide key={i}>
              <div className="relative h-full">
                <div className="absolute inset-0 bg-gray-900 z-0">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="h-full w-full object-cover opacity-90"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-1" />
                {/* Content */}
                <div className="absolute inset-0 flex items-center z-2">
                  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="slide-content max-w-2xl text-white">
                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
                        {s.title}
                      </h1>
                      <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 drop-shadow-md leading-relaxed">
                        {s.subtitle}
                      </p>
                      <div>
                        <Link
                          to={s.href}
                          className="inline-block rounded-xl bg-white text-gray-900 px-6 py-3 text-base font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                        >
                          {s.cta}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom pagination */}
        <div className="swiper-pagination absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2"></div>

        {/* Custom navigation */}
        <div className="swiper-button-prev absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white opacity-70 hover:opacity-100 transition-opacity duration-300 hidden md:block">
          <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </div>
        <div className="swiper-button-next absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white opacity-70 hover:opacity-100 transition-opacity duration-300 hidden md:block">
          <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
            <div className="reveal">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                අපේ අරමුණ — රුධිරය අවශ්‍ය සියළු දෙනාට
              </h2>
              <p className="text-lg text-gray-600 leading-8 mb-8">
                රුධිරය සුරක්ෂිතව, සවිස්තරාත්මකව, විශ්වාසදායකව කළමනාකරණය කරමින්
                රෝගීන්ගේ ජීවිත බේරා ගැනීම අපගේ ප්‍රමුඛ අරමුණයි. ඔබගේ දායකත්වය
                ජීවිත ගණනාවක් වෙනස් කරයි.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/campaigns"
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-base font-medium hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
                >
                  දානයේ කඳවුරු
                </Link>
                <Link
                  to="/learn"
                  className="rounded-xl bg-gray-900 text-white px-5 py-3 text-base font-medium hover:bg-black transition-colors shadow-sm hover:shadow-md"
                >
                  දැනුම වැඩි කරගන්න
                </Link>
              </div>
            </div>
            <div className="reveal">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=1200&auto=format&fit=crop"
                  alt="Donate blood"
                  className="w-full h-72 md:h-96 object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8">
            <Stat title="මෙම මාසයේ ඒකක" end={2845} suffix="" />
            <Stat title="අද අපොයින්ට්මෙන්ට්" end={312} suffix="" />
            <Stat title="ලියාපදිංචි දායකයින්" end={5104} suffix="+" />
            <Stat title="අනුරූප රෝගීන්" end={42} suffix="" />
          </div>
        </div>
      </section>

      {/* Upcoming campaigns (dynamic top 3) */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mb-10 flex items-end justify-between">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                එනම් කඳවුරු
              </h3>
              <p className="text-gray-600 mt-2">
                ඔබ සිටින ප්‍රදේශයේම සමීප කඳවුරකට එකතු වන්න.
              </p>
            </div>
            <Link
              to="/campaigns"
              className="text-base text-gray-900 font-medium hover:underline underline-offset-4"
            >
              සියල්ල බලන්න {totalCamps > HOME_CAMPS_LIMIT ? `(${totalCamps})` : ""} →
            </Link>
          </div>

          <div className="min-h-[12rem]">
            {campLoading ? (
              <HomeCampSkeleton />
            ) : campErr ? (
              <div className="reveal rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm">
                {campErr}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="reveal text-gray-600 text-sm">
                නවීන කඳවුරු මේ මොහොතේ නොමැත. <Link to="/campaigns" className="text-blue-600 underline">සියල්ල බලන්න</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((c) => {
                  const src = posterUrl(c.posterImg);
                  return (
                    <article
                      key={c._id}
                      className="reveal group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="h-44 w-full grid place-items-center bg-white overflow-hidden border-b">
                        {src ? (
                          <img
                            src={src}
                            alt={c.title}
                            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-gray-400 text-sm">
                            No poster
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h4 className="font-bold text-gray-900 text-lg mb-1 truncate">
                          {c.title}
                        </h4>
                        <p className="text-gray-600 text-sm mb-3 truncate">
                          {c.hospitalName || "—"}{c.organization ? ` • ${c.organization}` : ""}
                        </p>
                        <p className="text-gray-700 text-sm mb-4">
                          {new Date(c.startAt).toLocaleString()} • {c.venue || "—"}
                        </p>
                        <div className="flex items-center justify-between">
                          <Link
                            to="/campaigns"
                            className="inline-block text-sm rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors"
                          >
                            තොරතුරු
                          </Link>
                          <Link
                            to="/campaigns"
                            className="text-sm text-blue-700 hover:underline"
                          >
                            වැඩිදුර →
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                ඔබේ සාමූහික ආදරයෙන් ජීවිත බේරාගන්න.
              </h3>
              <p className="text-white/80 text-lg">
                ලියාපදිංචි වී නිතර දායකත්වය ලබා දීමෙන් රටේ රුධිර තොගය
                ශක්තිමත් කරමු.
              </p>
            </div>
            <div className="md:text-right">
              <Link
                to="/register"
                className="inline-block rounded-xl bg-white text-gray-900 px-6 py-3 text-base font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                දායකයෙකු වන්න
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- Sub-components ---------- */

function Stat({ title, end, suffix = "" }) {
  return (
    <div className="reveal rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
        <span className="counter tabular-nums" data-end={end}>
          0
        </span>
        <span>{suffix}</span>
      </div>
      <div className="text-gray-600">{title}</div>
    </div>
  );
}

function HomeCampSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
        >
          <div className="h-44 w-full bg-gray-100 animate-pulse" />
          <div className="p-6 space-y-3">
            <div className="h-5 w-2/3 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
