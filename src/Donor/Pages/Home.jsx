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

const slides = [
  {
    title: "ජීවිත බේරාගැනීමට ඔබේ රුධිරය",
    subtitle: "ඔබගේ කුඩා ඉල්ලීමක් — යමෙක්ගේ පූර්ණ ජීවිතයක්.",
    cta: "රුධිර දානයට එක්වන්න",
    href: "/donate",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "අදම රුධිර දානයට",
    subtitle: "සෞඛ්‍ය අංශයන් සමඟ රක්ත සුරක්ෂිතභාවය වැඩි දියුණු කරමු.",
    cta: "ඉදිරි කඳවුරැ බලන්න",
    href: "/campaigns",
    image:
      "https://images.unsplash.com/photo-1582719478185-2c1c9b1f382d?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "රෝගියෙකුට ඔබයි අපේක්ෂාව",
    subtitle: "සහයෝගයෙන් ජීවිත ගොඩනඟමු.",
    cta: "ආයතනික දායකත්වය",
    href: "/hospitals",
    image:
      "https://images.unsplash.com/photo-1584467735871-2d2fd4a66caa?q=80&w=1600&auto=format&fit=crop",
  },
];

export default function Home() {
  const pageRef = useRef(null);
  const swiperRef = useRef(null);
  const [swiperReady, setSwiperReady] = useState(false);

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
    
    // Animation for when slide changes
    const handleSlideChange = () => {
      const activeSlide = swiper.slides[swiper.activeIndex];
      const textElements = activeSlide.querySelectorAll('.slide-content > *');
      
      // Reset all slides
      swiper.slides.forEach(slide => {
        const content = slide.querySelector('.slide-content');
        if (content) {
          gsap.set(content.children, { opacity: 0, y: 20 });
        }
      });
      
      // Animate in active slide content
      gsap.to(textElements, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out"
      });
    };

    // Initial animation for first slide
    const initialSlide = swiper.slides[swiper.activeIndex];
    const initialTextElements = initialSlide.querySelectorAll('.slide-content > *');
    
    gsap.set(initialTextElements, { opacity: 0, y: 20 });
    gsap.to(initialTextElements, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power2.out",
      delay: 0.5
    });

    // Add event listener for slide changes
    swiper.on('slideChange', handleSlideChange);

    return () => {
      if (swiper) {
        swiper.off('slideChange', handleSlideChange);
      }
    };
  }, [swiperReady]);

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
            el: '.swiper-pagination',
            bulletClass: 'swiper-pagination-bullet',
            bulletActiveClass: 'swiper-pagination-bullet-active',
            renderBullet: (index, className) => {
              return `<span class="${className} bg-white opacity-50 hover:opacity-75 transition-opacity duration-300"></span>`;
            }
          }}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
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
            <Stat title="ලියාපදිංචි දායකයින්" end={5104} suffix="+"/>
            <Stat title="අනුරූප රෝගීන්" end={42} suffix="" />
          </div>
        </div>
      </section>

      {/* Upcoming campaigns */}
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
              සියල්ල බලන්න →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "විශ්ව විද්‍යාල රුධිර දානය",
                date: "2025 සැප් — 12",
                place: "කොළඹ 07",
                img: "https://images.unsplash.com/photo-1516542076529-1ea3854896e1?q=80&w=1200&auto=format&fit=crop",
              },
              {
                title: "නගර සභා ශාලාව",
                date: "2025 සැප් — 15",
                place: "මාතර",
                img: "https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=1200&auto=format&fit=crop",
              },
              {
                title: "ඇඹිලිපිටිය සෞඛ්‍ය කඳවුර",
                date: "2025 සැප් — 21",
                place: "රත්නපුර",
                img: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop",
              },
            ].map((c, idx) => (
              <article
                key={idx}
                className="reveal group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg"
              >
                <div className="h-48 w-full overflow-hidden">
                  <img
                    src={c.img}
                    alt={c.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h4 className="font-bold text-gray-900 text-lg mb-2">{c.title}</h4>
                  <p className="text-gray-600 mb-4">
                    {c.date} • {c.place}
                  </p>
                  <div>
                    <Link
                      to="/campaigns"
                      className="inline-block text-sm rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      තොරතුරු
                    </Link>
                  </div>
                </div>
              </article>
            ))}
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