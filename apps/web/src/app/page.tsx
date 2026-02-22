"use client";

import Link from "next/link";
import { useEffect } from "react";
import anime from "animejs";

export default function HomePage() {
  useEffect(() => {
    const timeline = anime.timeline({
      easing: "easeOutExpo",
      duration: 700
    });

    timeline
      .add({
        targets: ".hero",
        opacity: [0, 1],
        translateY: [24, 0]
      })
      .add(
        {
          targets: ".hero .eyebrow, .hero-title, .hero-copy, .hero-actions",
          opacity: [0, 1],
          translateY: [18, 0],
          delay: anime.stagger(90)
        },
        "-=520"
      )
      .add(
        {
          targets: ".hero-panel",
          opacity: [0, 1],
          translateY: [28, 0],
          scale: [0.97, 1]
        },
        "-=640"
      )
      .add(
        {
          targets: ".feature-card",
          opacity: [0, 1],
          translateY: [24, 0],
          delay: anime.stagger(120)
        },
        "-=420"
      )
      .add(
        {
          targets: ".rail-card",
          opacity: [0, 1],
          translateY: [20, 0],
          delay: anime.stagger(120)
        },
        "-=360"
      )
      .add(
        {
          targets: ".footer-cta",
          opacity: [0, 1],
          translateY: [16, 0]
        },
        "-=300"
      );

    const floatingPanel = anime({
      targets: ".hero-panel",
      translateY: [-4, 6],
      duration: 2200,
      easing: "easeInOutSine",
      direction: "alternate",
      loop: true,
      autoplay: false
    });

    const ambientDrift = anime({
      targets: ".ghibli-orb, .ghibli-cloud, .ghibli-mist, .ghibli-leaf",
      translateY: [-10, 14],
      translateX: [12, -12],
      scale: [0.98, 1.02],
      duration: 7200,
      easing: "easeInOutSine",
      direction: "alternate",
      loop: true,
      autoplay: false,
      delay: anime.stagger(900)
    });

    timeline.finished.then(() => {
      floatingPanel.play();
      ambientDrift.play();
    });

    const cards = Array.from(document.querySelectorAll<HTMLElement>(".feature-card"));
    const enterHandlers = new Map<HTMLElement, () => void>();
    const leaveHandlers = new Map<HTMLElement, () => void>();

    cards.forEach((card) => {
      const handleEnter = () => {
        anime({
          targets: card,
          translateY: -8,
          boxShadow: "0 18px 38px rgba(15, 23, 42, 0.16)",
          duration: 260,
          easing: "easeOutCubic"
        });
      };

      const handleLeave = () => {
        anime({
          targets: card,
          translateY: 0,
          boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)",
          duration: 260,
          easing: "easeOutCubic"
        });
      };

      card.addEventListener("mouseenter", handleEnter);
      card.addEventListener("mouseleave", handleLeave);
      enterHandlers.set(card, handleEnter);
      leaveHandlers.set(card, handleLeave);
    });

    return () => {
      timeline.pause();
      floatingPanel.pause();
      ambientDrift.pause();
      anime.remove(".hero-panel");
      cards.forEach((card) => {
        const enter = enterHandlers.get(card);
        const leave = leaveHandlers.get(card);
        if (enter) {
          card.removeEventListener("mouseenter", enter);
        }
        if (leave) {
          card.removeEventListener("mouseleave", leave);
        }
      });
    };
  }, []);

  return (
    <main className="scene">
      <div className="ghibli-skywash" />
      <div className="ghibli-orb" style={{ top: "12%", left: "8%" }} />
      <div className="ghibli-cloud" style={{ top: "6%", right: "6%" }} />
      <div className="ghibli-mist" style={{ bottom: "12%", left: "18%" }} />
      <div className="ghibli-leaf" style={{ top: "38%", right: "22%" }} />
      <div className="ghibli-leaf" style={{ top: "64%", left: "16%" }} />
      <div className="ghibli-haze" />
      <div className="ghibli-grain" />
      <div className="page-shell">
        <section className="hero">
          <div className="hero-inner">
            <div>
              <span className="eyebrow">Goal Coach · Beta</span>
              <h1 className="hero-title">Build a rhythm you can actually keep.</h1>
              <p className="hero-copy">
                Goal Coach turns intention into daily momentum. Map your priorities, track the wins that matter, and
                stay grounded with a calm, intelligent coaching loop.
              </p>
              <div className="hero-actions">
                <Link className="cta cta-primary" href="/workbench">
                  Launch the Workbench
                </Link>
                <a className="cta cta-secondary" href="#flow">
                  See how it works
                </a>
              </div>
            </div>
            <div className="hero-panel">
              <div className="panel-header">
                <span>Focus Score</span>
                <span>Week 08</span>
              </div>
              <div className="panel-score">86%</div>
              <div className="panel-card">
                <strong>Top habits today</strong>
                <span>Morning review • 12 mins</span>
                <span>Stretch + reset • 8 mins</span>
                <span>Deep work block • 60 mins</span>
              </div>
              <div className="panel-card">
                <strong>Coach note</strong>
                <span>Stack your afternoon focus with a short walk between meetings.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section-grid" id="flow">
          <div className="feature-card">
            <div className="feature-badge">01 · Set the North Star</div>
            <h3>Define a goal that stays visible.</h3>
            <p>Choose what matters most and align everything around it with weekly checkpoints and gentle nudges.</p>
          </div>
          <div className="feature-card">
            <div className="feature-badge">02 · Craft the ritual</div>
            <h3>Turn priorities into habits.</h3>
            <p>Design tiny actions, schedule focus windows, and let the coach handle the reminders.</p>
          </div>
          <div className="feature-card">
            <div className="feature-badge">03 · Review the signal</div>
            <h3>See momentum, not noise.</h3>
            <p>Visualize progress with clean insights so you know exactly what is working.</p>
          </div>
        </section>

        <section className="rail">
          <div className="rail-card">
            <h3>Designed for focus, not friction.</h3>
            <p>
              Goal Coach is a contract-first platform that connects onboarding, habits, and real-time chat into a single
              coaching experience.
            </p>
            <div className="steps">
              <span>Daily check-ins with a clear objective</span>
              <span>Flexible habit stacks with smart reminders</span>
              <span>Guided reflections every Friday</span>
            </div>
          </div>
          <div className="rail-card">
            <h3>Ready to try it?</h3>
            <p>Open the workbench to explore the API-powered flows behind onboarding, habits, and dashboard insights.</p>
            <Link className="cta cta-primary" href="/workbench">
              Open Workbench
            </Link>
          </div>
        </section>

        <section className="footer-cta">
          <h2>Make the next seven days count.</h2>
          <p>Start with one focus block today and let the coach do the rest.</p>
          <Link className="cta cta-secondary" href="/workbench">
            Get Started
          </Link>
        </section>
      </div>
    </main>
  );
}
