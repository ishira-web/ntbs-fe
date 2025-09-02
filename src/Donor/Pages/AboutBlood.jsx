// src/pages/AboutBlood.jsx
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Heart,
  HeartHandshake,
  Droplet,
  ShieldCheck,
  Activity,
  Users,
  Smile,
  Timer,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ClipboardList,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function AboutBlood() {
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.from(el, {
          y: 20,
          opacity: 0,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={pageRef} className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="h-[46vh] w-full object-cover"
            src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2000&auto=format&fit=crop"
            alt="Blood donation"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
        </div>

        <div className="relative h-[46vh]">
          <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl text-white">
              <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
                About Blood Donation — <span className="underline decoration-white/60">simply put</span>
              </h1>
              <p className="mt-3 text-white/90">
                One bag of your blood can literally save a life.
              </p>
              <div className="mt-5">
                <Link
                  to="/donate"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-gray-900 px-5 py-2.5 text-sm font-medium hover:bg-gray-100 transition"
                >
                  <Heart className="h-4 w-4" /> Donate
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="reveal mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Real benefits of donating blood
            </h2>
            <p className="mt-2 text-gray-600">
              Good for you, great for someone else.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <BenefitCard
              icon={Droplet}
              title="Directly helps someone"
              text="Your donation doesn’t sit around—it reaches a patient who needs it."
            />
            <BenefitCard
              icon={ShieldCheck}
              title="Free mini health check"
              text="Basic checks before donation. If something looks off, the team will guide you."
            />
            <BenefitCard
              icon={Activity}
              title="Feel-good boost"
              text="Doing good feels good. Simple as that."
            />
            <BenefitCard
              icon={Users}
              title="Give back to the community"
              text="When more of us donate, hospitals can respond faster."
            />
            <BenefitCard
              icon={Smile}
              title="Lasting happiness"
              text="That ‘I helped’ feeling sticks with you all day."
            />
            <BenefitCard
              icon={Timer}
              title="Small time, big impact"
              text="About 30–45 minutes start to finish. The impact can be huge."
            />
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="reveal mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Am I eligible to donate?
            </h2>
            <p className="mt-2 text-gray-600">
              This is a rough guide. The hospital team makes the final call.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="reveal rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-medium flex items-center gap-2 text-gray-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Generally OK
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>• Age 18–60</li>
                <li>• Weight ≈ 50kg+ (can vary)</li>
                <li>• Feeling well</li>
                <li>• At least 4 months since your last donation</li>
              </ul>
            </div>

            <div className="reveal rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-medium flex items-center gap-2 text-gray-900">
                <XCircle className="h-5 w-5 text-rose-600" />
                Please wait for now
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li>• Fever/infection — come back once recovered</li>
                <li>• New tattoo/piercing — wait ~6 months</li>
                <li>• Pregnant or breastfeeding</li>
                <li>• Any other medical reason advised by staff</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="reveal mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              How does it work?
            </h2>
            <p className="mt-2 text-gray-600">No need to worry—just 5 steps.</p>
          </header>

          <ol className="relative border-s border-gray-200 pl-6 space-y-6">
            {[
              { icon: ClipboardList, title: "Register", text: "Basic details, quick and easy." },
              { icon: ShieldCheck, title: "Health check", text: "Simple checks like BP and haemoglobin." },
              { icon: Droplet, title: "Donation", text: "About 10–15 minutes." },
              { icon: Smile, title: "Rest & snack", text: "Have a biscuit and a drink—take a moment." },
              { icon: HeartHandshake, title: "All done", text: "Head out and carry on with your day." },
            ].map((s, i) => (
              <li key={i} className="reveal">
                <Step icon={s.icon} title={s.title} text={s.text} index={i + 1} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Myths vs Facts */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="reveal mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Myths vs Facts
            </h2>
            <p className="mt-2 text-gray-600">Let’s clear a few things up.</p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MythFact
              myth="I’ll feel weak for a long time after donating."
              fact="Your body replenishes quickly. Staff make sure you’re safe to donate."
            />
            <MythFact
              myth="You can catch diseases from donating."
              fact="No—you’re protected. It’s a sterile, professional process with single-use equipment."
            />
            <MythFact
              myth="Others will donate. Mine won’t matter."
              fact="It does. Demand is often higher than supply. Your donation counts."
            />
            <MythFact
              myth="It takes too long."
              fact="Start to finish is roughly 30–45 minutes. Big impact for a small time cost."
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <header className="reveal mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">FAQ</h2>
            <p className="mt-2 text-gray-600">Quick answers.</p>
          </header>

          <div className="reveal divide-y rounded-2xl border border-gray-200 bg-white shadow-sm">
            {[
              {
                q: "How often can I donate?",
                a: "About every 4 months (varies by guidelines and your health).",
              },
              {
                q: "Can I hit the gym the same day?",
                a: "Take it easy. Avoid heavy lifting until the next day.",
              },
              {
                q: "How do I find a nearby campaign?",
                a: "Check our “Campaigns” page for upcoming donation drives.",
              },
            ].map((f, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{f.q}</span>
                  </div>
                  <span className="text-gray-500 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="px-4 pb-4 text-sm text-gray-700">{f.a}</div>
              </details>
            ))}
          </div>

          <div className="reveal mt-8 text-center">
            <Link
              to="/campaigns"
              className="inline-block rounded-xl bg-gray-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-black"
            >
              See upcoming campaigns
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal grid grid-cols-1 gap-6 md:grid-cols-3 items-center">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-semibold">Your blood. Someone else’s second chance.</h3>
              <p className="text-white/80 mt-2">
                A small slice of your time can change someone’s life.
              </p>
            </div>
            <div className="md:text-right">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-gray-900 px-5 py-2.5 text-sm font-medium hover:bg-gray-100"
              >
                <Heart className="h-4 w-4" /> Register now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- Small UI bits ---------- */
function BenefitCard({ icon: Icon, title, text }) {
  return (
    <article className="reveal group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{text}</p>
        </div>
      </div>
    </article>
  );
}

function Step({ icon: Icon, title, text, index }) {
  return (
    <div className="ms-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute -left-11 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white text-xs">
            {index}
          </span>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <Icon className="h-5 w-5 text-gray-800" />
          </span>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{text}</p>
        </div>
      </div>
    </div>
  );
}

function MythFact({ myth, fact }) {
  return (
    <div className="reveal grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-5">
      <div className="md:col-span-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
          Myth
        </div>
        <p className="mt-2 text-gray-700">{myth}</p>
      </div>
      <div className="md:col-span-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
          Fact
        </div>
        <p className="mt-2 text-gray-700">{fact}</p>
      </div>
    </div>
  );
}
