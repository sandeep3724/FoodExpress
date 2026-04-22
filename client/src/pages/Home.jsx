import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

// ── Google Fonts ────────────────────────────────────────────────────
const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700;800&display=swap";

// ── Floating particle canvas ────────────────────────────────────────
function Particles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.4,
      dx: (Math.random() - 0.5) * 0.28,
      dy: -(Math.random() * 0.45 + 0.12),
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.pulse += 0.018;
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        const a = p.opacity * (0.65 + 0.35 * Math.sin(p.pulse));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `rgba(255,210,100,${a})`);
        g.addColorStop(1, "rgba(255,180,50,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,235,160,${a})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 1,
      }}
    />
  );
}

// ── God rays ────────────────────────────────────────────────────────
function GodRays() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {[...Array(9)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            width: `${2.5 + i * 1.4}px`,
            height: "145%",
            background: `linear-gradient(180deg, rgba(255,205,70,${0.055 + i * 0.004}) 0%, transparent 65%)`,
            transform: `translateX(-50%) rotate(${-38 + i * 9.5}deg)`,
            transformOrigin: "top center",
            animation: `rayPulse ${4.2 + i * 0.65}s ease-in-out infinite`,
            animationDelay: `${i * 0.38}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Intersection reveal hook ────────────────────────────────────────
function useReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Data ────────────────────────────────────────────────────────────
const cuisines = [
  { label: "All",       emoji: "✦" },
  { label: "Biryani",   emoji: "🍛" },
  { label: "Burger",    emoji: "🍔" },
  { label: "Pizza",     emoji: "🍕" },
  { label: "Ice Cream", emoji: "🍦" },
  { label: "Chicken",   emoji: "🍗" },
];
const taglines = [
  "Where every meal\nis a divine experience.",
  "Crafted with love,\ndelivered with grace.",
  "Your table in heaven\nawaits.",
  "Flavours beyond\nthe ordinary.",
];

// ════════════════════════════════════════════════════════════════════
export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCuisine, setActiveCuisine] = useState("All");
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [taglineFade, setTaglineFade] = useState(true);
  const [pageIn, setPageIn] = useState(false);

  // Fonts + body override
  useEffect(() => {
    if (!document.querySelector("#heaven-fonts")) {
      const l = document.createElement("link");
      l.id = "heaven-fonts"; l.rel = "stylesheet"; l.href = FONT_LINK;
      document.head.appendChild(l);
    }
    document.body.style.background = "#060408";
    document.body.style.color = "#f5e6c8";
    setTimeout(() => setPageIn(true), 80);
    return () => { document.body.style.background = ""; document.body.style.color = ""; };
  }, []);

  useEffect(() => {
    API.get("/restaurants")
      .then((r) => setRestaurants(r.data))
      .catch(console.log)
      .finally(() => setLoading(false));
  }, []);

  // Tagline rotation
  useEffect(() => {
    const t = setInterval(() => {
      setTaglineFade(false);
      setTimeout(() => { setTaglineIdx((i) => (i + 1) % taglines.length); setTaglineFade(true); }, 480);
    }, 3800);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(
    () =>
      restaurants.filter((r) => {
        const q = `${r.name} ${r.location}`.toLowerCase();
        return (
          q.includes(search.toLowerCase()) &&
          (activeCuisine === "All" || r.name.toLowerCase().includes(activeCuisine.toLowerCase()))
        );
      }),
    [restaurants, search, activeCuisine]
  );

  return (
    <div style={{
      background: "#060408",
      minHeight: "100vh",
      fontFamily: "'Montserrat', sans-serif",
      opacity: pageIn ? 1 : 0,
      transition: "opacity 1.3s ease",
      overflowX: "hidden",
    }}>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {/* Deep cosmos bg */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 55% at 50% 0%, #1b0e30 0%, #0a060f 42%, #060408 100%)",
        }} />
        {/* Gold halo */}
        <div style={{
          position: "absolute", top: "-18%", left: "50%", transform: "translateX(-50%)",
          width: 960, height: 520,
          background: "radial-gradient(ellipse at 50% 30%, rgba(255,185,45,0.10) 0%, transparent 68%)",
          pointerEvents: "none",
        }} />
        <GodRays />
        <Particles />

        {/* Horizon glow line */}
        <div style={{
          position: "absolute", top: "38%", left: "50%", transform: "translateX(-50%)",
          width: "72%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,198,70,0.3), rgba(255,220,110,0.65), rgba(255,198,70,0.3), transparent)",
          boxShadow: "0 0 50px 10px rgba(255,185,45,0.12)",
          animation: "horizonPulse 3.5s ease-in-out infinite",
        }} />

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px", maxWidth: 780 }}>
          {/* Brand stamp */}
          <div style={{
            fontSize: 13, letterSpacing: 8, color: "rgba(255,198,70,0.55)",
            marginBottom: 30, fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic", fontWeight: 300,
            animation: "fadeDown 1s ease 0.3s both",
          }}>
            ✦ &nbsp; F O O D E X P R E S S &nbsp; ✦
          </div>

          {/* Animated headline */}
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(46px, 7.5vw, 92px)",
            fontWeight: 300, lineHeight: 1.1,
            color: "#f5e6c8", letterSpacing: "-0.5px",
            marginBottom: 28, whiteSpace: "pre-line",
            opacity: taglineFade ? 1 : 0,
            transform: taglineFade ? "translateY(0)" : "translateY(-14px)",
            transition: "opacity 0.48s ease, transform 0.48s ease",
            textShadow: "0 0 90px rgba(255,195,50,0.18)",
            animation: "fadeDown 1.1s ease 0.5s both",
          }}>
            {taglines[taglineIdx]}
          </h1>

          {/* Gold rule */}
          <div style={{
            width: 80, height: 1.5, margin: "0 auto 26px",
            background: "linear-gradient(90deg, transparent, #c9922a, #f5d080, #c9922a, transparent)",
            animation: "fadeUp 1s ease 0.9s both",
          }} />

          <p style={{
            fontSize: 13, color: "rgba(245,230,200,0.52)",
            letterSpacing: 2.5, textTransform: "uppercase",
            fontWeight: 500, marginBottom: 46,
            animation: "fadeUp 1s ease 1s both",
          }}>
            Curated restaurants · Swift delivery · Royal experience
          </p>

          {/* Search bar */}
          <div style={{
            position: "relative", maxWidth: 540, margin: "0 auto 38px",
            animation: "fadeUp 1s ease 1.1s both",
          }}>
            <span style={{
              position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
              fontSize: 16, color: "rgba(201,146,42,0.5)", pointerEvents: "none",
            }}>✦</span>
            <input
              type="text"
              placeholder="Search restaurants, cuisines…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "18px 48px",
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(201,146,42,0.3)",
                borderRadius: 14,
                color: "#f5e6c8",
                fontSize: 15, outline: "none",
                backdropFilter: "blur(22px)",
                transition: "border-color 0.3s, box-shadow 0.3s",
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: 0.4,
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(201,146,42,0.72)"; e.target.style.boxShadow = "0 0 36px rgba(201,146,42,0.13)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(201,146,42,0.3)"; e.target.style.boxShadow = "none"; }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none",
                color: "rgba(245,230,200,0.45)", cursor: "pointer", fontSize: 15,
              }}>✕</button>
            )}
          </div>

          {/* Cuisine pills */}
          <div style={{
            display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap",
            animation: "fadeUp 1s ease 1.22s both",
          }}>
            {cuisines.map((c) => (
              <button
                key={c.label}
                onClick={() => setActiveCuisine(c.label)}
                style={{
                  padding: "10px 20px", borderRadius: 999,
                  border: `1px solid ${activeCuisine === c.label ? "#c9922a" : "rgba(201,146,42,0.18)"}`,
                  background: activeCuisine === c.label
                    ? "linear-gradient(135deg, rgba(201,146,42,0.28), rgba(245,208,128,0.12))"
                    : "rgba(255,255,255,0.025)",
                  color: activeCuisine === c.label ? "#f5d080" : "rgba(245,230,200,0.45)",
                  fontWeight: 600, fontSize: 13, letterSpacing: 0.4,
                  cursor: "pointer", backdropFilter: "blur(10px)",
                  transition: "all 0.25s ease",
                  boxShadow: activeCuisine === c.label ? "0 4px 20px rgba(201,146,42,0.18)" : "none",
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          animation: "fadeUp 1s ease 1.6s both", zIndex: 2,
        }}>
          <span style={{ fontSize: 10, letterSpacing: 3.5, color: "rgba(201,146,42,0.45)", textTransform: "uppercase" }}>Discover</span>
          <div style={{
            width: 1, height: 50,
            background: "linear-gradient(180deg, rgba(201,146,42,0.5), transparent)",
            animation: "scrollLine 1.9s ease-in-out infinite",
          }} />
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,146,42,0.28), transparent)" }} />

      {/* ══ RESTAURANTS ══════════════════════════════════════════════ */}
      <RestaurantsSection
        restaurants={filtered}
        loading={loading}
        onClear={() => { setSearch(""); setActiveCuisine("All"); }}
      />

      {/* ══ HOW IT WORKS ════════════════════════════════════════════ */}
      <HowSection />

      {/* ══ FOOTER CTA ══════════════════════════════════════════════ */}
      <FooterCTA />

      {/* ══ Keyframes ════════════════════════════════════════════════ */}
      <style>{`
        @keyframes fadeDown    { from{opacity:0;transform:translateY(-22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(22px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes rayPulse    { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes horizonPulse{ 0%,100%{opacity:.45} 50%{opacity:1} }
        @keyframes scrollLine  { 0%,100%{opacity:0;transform:scaleY(0);transform-origin:top} 50%{opacity:1;transform:scaleY(1)} }
        @keyframes cardReveal  { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmerGold { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        @keyframes haloFloat   { 0%,100%{text-shadow:0 0 30px rgba(201,146,42,0)} 50%{text-shadow:0 0 60px rgba(201,146,42,0.45)} }
        ::placeholder          { color:rgba(245,230,200,0.28) !important; }
      `}</style>
    </div>
  );
}

// ── Restaurants grid ────────────────────────────────────────────────
function RestaurantsSection({ restaurants, loading, onClear }) {
  const [ref, visible] = useReveal(0.04);
  return (
    <section ref={ref} style={{ padding: "100px 24px", maxWidth: 1320, margin: "0 auto" }}>
      {/* Section header */}
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <p style={{
          fontSize: 10, letterSpacing: 5, color: "rgba(201,146,42,0.55)",
          textTransform: "uppercase", marginBottom: 14, fontWeight: 600,
        }}>Our Collection</p>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(36px, 5vw, 62px)",
          fontWeight: 300, color: "#f5e6c8",
          marginBottom: 18, letterSpacing: "-0.5px",
        }}>
          Finest Restaurants
        </h2>
        <div style={{ width: 56, height: 1, margin: "0 auto", background: "linear-gradient(90deg, transparent, #c9922a, transparent)" }} />
      </div>

      {loading ? (
        <GoldSkeleton />
      ) : restaurants.length === 0 ? (
        <EmptyState onClear={onClear} />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 28,
        }}>
          {restaurants.map((r, i) => (
            <RestaurantCard key={r._id} r={r} index={i} visible={visible} />
            
          ))}
        </div>
        
      )}
    </section>
  );
}
<p style={{ color: "#f5d080", fontSize: "14px" }}>
  🔥 60% OFF up to ₹100
</p>
function RestaurantCard({ r, index, visible }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 22, overflow: "hidden",
        background: "linear-gradient(160deg, rgba(28,16,48,0.97) 0%, rgba(10,6,18,0.99) 100%)",
        border: `1px solid ${hov ? "rgba(201,146,42,0.55)" : "rgba(201,146,42,0.1)"}`,
        transition: "all 0.4s ease",
        transform: hov ? "translateY(-9px)" : "translateY(0)",
        boxShadow: hov
          ? "0 36px 90px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,146,42,0.22), 0 0 70px rgba(201,146,42,0.07)"
          : "0 8px 36px rgba(0,0,0,0.55)",
        animation: visible ? "cardReveal 0.58s ease forwards" : "none",
        animationDelay: `${index * 0.08}s`,
        opacity: visible ? undefined : 0,
      }}
    >
      {/* Image zone */}
      <div style={{ position: "relative", height: 228, overflow: "hidden" }}>
        <img
          src={r.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"}
          alt={r.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            transform: hov ? "scale(1.09)" : "scale(1)",
            transition: "transform 0.5s ease",
            filter: `brightness(${hov ? 0.75 : 0.6})`,
          }}
        />
        {/* Velvet vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(8,4,16,0.9) 0%, rgba(8,4,16,0.15) 55%, transparent 100%)",
        }} />
        {/* Gold shimmer sweep on hover */}
        {hov && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(130deg, transparent 35%, rgba(201,146,42,0.07) 50%, transparent 65%)",
            backgroundSize: "600px 100%",
            animation: "shimmerGold 1.3s linear infinite",
          }} />
        )}
        {/* Rating pill */}
        <div style={{
          position: "absolute", top: 14, right: 14,
          background: "rgba(201,146,42,0.18)",
          border: "1px solid rgba(201,146,42,0.38)",
          backdropFilter: "blur(14px)",
          padding: "5px 13px", borderRadius: 999,
          fontSize: 13, fontWeight: 700, color: "#f5d080",
          letterSpacing: 0.5,
        }}>
          ✦ {r.rating || 4.3}
        </div>
        {/* Name over image */}
        <div style={{ position: "absolute", bottom: 16, left: 18, right: 18 }}>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 26, fontWeight: 600,
            color: "#f5e6c8", lineHeight: 1.1,
            textShadow: "0 2px 22px rgba(0,0,0,0.85)",
          }}>{r.name}</h3>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 22px 24px" }}>
        <p style={{ fontSize: 13, color: "rgba(201,146,42,0.55)", marginBottom: 14, letterSpacing: 0.4 }}>
          📍 {r.location}
        </p>
        <p style={{ fontSize: 12, color: "rgba(245,230,200,0.3)", marginBottom: 20, letterSpacing: 0.6 }}>
          🕐 25–40 min &nbsp;·&nbsp; 🛵 Free delivery
        </p>
        <Link
          to={`/foods/${r._id}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "14px 20px",
            background: hov
              ? "linear-gradient(135deg, rgba(201,146,42,0.38), rgba(245,208,128,0.18))"
              : "rgba(201,146,42,0.07)",
            border: `1px solid ${hov ? "rgba(201,146,42,0.68)" : "rgba(201,146,42,0.22)"}`,
            borderRadius: 12,
            color: "#f5d080",
            fontWeight: 700, fontSize: 12,
            letterSpacing: 2, textTransform: "uppercase",
            textDecoration: "none",
            transition: "all 0.3s ease",
            boxShadow: hov ? "0 0 28px rgba(201,146,42,0.14)" : "none",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Explore Menu <span style={{ fontSize: 15 }}>→</span>
        </Link>
      </div>
    </div>
  );
}

function GoldSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 28 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          borderRadius: 22, overflow: "hidden",
          background: "rgba(18,10,30,0.9)",
          border: "1px solid rgba(201,146,42,0.07)",
        }}>
          <div style={{
            height: 228,
            background: "linear-gradient(90deg, rgba(201,146,42,0.04) 25%, rgba(201,146,42,0.09) 50%, rgba(201,146,42,0.04) 75%)",
            backgroundSize: "600px 100%",
            animation: "shimmerGold 1.6s infinite",
            animationDelay: `${i * 0.12}s`,
          }} />
          <div style={{ padding: 22 }}>
            {[70, 45, 90].map((w, j) => (
              <div key={j} style={{
                height: 12, width: `${w}%`, borderRadius: 6, marginBottom: 14,
                background: "linear-gradient(90deg, rgba(201,146,42,0.04) 25%, rgba(201,146,42,0.09) 50%, rgba(201,146,42,0.04) 75%)",
                backgroundSize: "400px 100%",
                animation: "shimmerGold 1.6s infinite",
                animationDelay: `${j * 0.16}s`,
              }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClear }) {
  return (
    <div style={{
      textAlign: "center", padding: "90px 24px",
      background: "rgba(18,10,30,0.5)",
      border: "1px solid rgba(201,146,42,0.1)",
      borderRadius: 24,
    }}>
      <div style={{ fontSize: 52, marginBottom: 22, color: "rgba(201,146,42,0.4)", fontFamily: "'Cormorant Garamond', serif" }}>✦</div>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 300, color: "#f5e6c8", marginBottom: 12 }}>
        Nothing found
      </h3>
      <p style={{ color: "rgba(245,230,200,0.35)", marginBottom: 34, fontSize: 15 }}>
        Try a different search or clear the filters.
      </p>
      <button onClick={onClear} style={{
        padding: "14px 34px",
        background: "rgba(201,146,42,0.1)",
        border: "1px solid rgba(201,146,42,0.38)",
        borderRadius: 12, color: "#f5d080",
        fontWeight: 700, fontSize: 13,
        letterSpacing: 2, textTransform: "uppercase",
        cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
      }}>
        Clear Filters
      </button>
    </div>
  );
}

// ── How It Works ────────────────────────────────────────────────────
function HowSection() {
  const [ref, visible] = useReveal();
  const steps = [
    { icon: "📍", numeral: "I",   title: "Choose",  desc: "Browse our curated collection of premium restaurants." },
    { icon: "🛒", numeral: "II",  title: "Select",  desc: "Add desired dishes to your cart with a single touch." },
    { icon: "✦",  numeral: "III", title: "Pay",     desc: "Instant, secure QR payment via UPI in seconds." },
    { icon: "🚀", numeral: "IV",  title: "Receive", desc: "Track your order from kitchen to your door, live." },
  ];
  return (
    <section style={{
      position: "relative", padding: "110px 24px",
      background: "linear-gradient(180deg, #060408 0%, #0e0820 50%, #060408 100%)",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 860, height: 420,
        background: "radial-gradient(ellipse, rgba(201,146,42,0.05) 0%, transparent 68%)",
        pointerEvents: "none",
      }} />
      <div ref={ref} style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 68 }}>
          <p style={{ fontSize: 10, letterSpacing: 5, color: "rgba(201,146,42,0.55)", textTransform: "uppercase", marginBottom: 14, fontWeight: 600 }}>
            The Journey
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(34px, 5vw, 58px)",
            fontWeight: 300, color: "#f5e6c8", letterSpacing: "-0.5px",
          }}>
            From craving to satisfaction
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {steps.map((s, i) => (
            <StepCard key={i} s={s} i={i} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ s, i, visible }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "38px 26px", textAlign: "center",
        background: "linear-gradient(160deg, rgba(28,16,48,0.55) 0%, rgba(10,6,18,0.75) 100%)",
        border: `1px solid ${hov ? "rgba(201,146,42,0.4)" : "rgba(201,146,42,0.12)"}`,
        borderRadius: 22,
        transition: "all 0.35s ease",
        transform: hov ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hov ? "0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(201,146,42,0.06)" : "none",
        animation: visible ? "cardReveal 0.58s ease forwards" : "none",
        animationDelay: `${i * 0.12}s`,
        opacity: visible ? undefined : 0,
      }}
    >
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 11, letterSpacing: 4,
        color: "rgba(201,146,42,0.45)",
        marginBottom: 22, textTransform: "uppercase",
      }}>{s.numeral}</div>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: hov ? "rgba(201,146,42,0.14)" : "rgba(201,146,42,0.07)",
        border: `1px solid ${hov ? "rgba(201,146,42,0.45)" : "rgba(201,146,42,0.2)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 22px", fontSize: 26,
        boxShadow: hov ? "0 0 40px rgba(201,146,42,0.18)" : "none",
        transition: "all 0.35s ease",
      }}>{s.icon}</div>
      <h3 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 26, fontWeight: 600,
        color: "#f5e6c8", marginBottom: 12,
      }}>{s.title}</h3>
      <p style={{ fontSize: 14, color: "rgba(245,230,200,0.4)", lineHeight: 1.75 }}>{s.desc}</p>
    </div>
  );
}

// ── Footer CTA ──────────────────────────────────────────────────────
function FooterCTA() {
  const [ref, visible] = useReveal();
  const [hov, setHov] = useState(false);
  return (
    <section ref={ref} style={{
      padding: "110px 24px", textAlign: "center",
      position: "relative", overflow: "hidden",
      background: "#060408",
      borderTop: "1px solid rgba(201,146,42,0.1)",
    }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 720, height: 380,
        background: "radial-gradient(ellipse, rgba(201,146,42,0.07) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "relative", zIndex: 1, maxWidth: 580, margin: "0 auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.85s ease, transform 0.85s ease",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 56, color: "rgba(201,146,42,0.38)",
          marginBottom: 22, animation: "haloFloat 3.2s ease-in-out infinite",
        }}>✦</div>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(32px, 5vw, 54px)",
          fontWeight: 300, color: "#f5e6c8",
          marginBottom: 18, lineHeight: 1.15, letterSpacing: "-0.5px",
        }}>
          Begin your culinary journey
        </h2>
        <div style={{ width: 50, height: 1, margin: "0 auto 22px", background: "linear-gradient(90deg, transparent, #c9922a, transparent)" }} />
        <p style={{
          fontSize: 15, color: "rgba(245,230,200,0.4)",
          lineHeight: 1.85, marginBottom: 46, letterSpacing: 0.3,
        }}>
          Join thousands who have discovered a new standard of food delivery.
          Free to start, extraordinary to experience.
        </p>
        <Link
          to="/register"
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            display: "inline-block",
            padding: "18px 52px",
            background: hov
              ? "linear-gradient(135deg, rgba(201,146,42,0.48), rgba(245,208,128,0.22))"
              : "rgba(201,146,42,0.1)",
            border: `1px solid ${hov ? "rgba(201,146,42,0.78)" : "rgba(201,146,42,0.35)"}`,
            borderRadius: 14, color: "#f5d080",
            fontWeight: 700, fontSize: 12,
            letterSpacing: 3, textTransform: "uppercase",
            textDecoration: "none",
            transition: "all 0.35s ease",
            boxShadow: hov
              ? "0 0 55px rgba(201,146,42,0.2), 0 18px 44px rgba(0,0,0,0.45)"
              : "0 8px 28px rgba(0,0,0,0.35)",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Enter the Experience
        </Link>
        <p style={{ marginTop: 22, fontSize: 11, color: "rgba(245,230,200,0.2)", letterSpacing: 2 }}>
          FREE · NO CARD REQUIRED
        </p>
      </div>
    </section>
  );
}
