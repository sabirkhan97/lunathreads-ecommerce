import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Moon, Sun, Monitor, Plus, Pencil, Trash2, X, Upload, Copy, MessageCircle, ArrowUpRight,
  Lock, LogOut, ShoppingBag, Heart, Search, ArrowLeft, ArrowUp, Share2, Check, Truck,
  ShieldCheck, Sparkles, ChevronRight, ChevronDown, Clock
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Defaults & helpers                                                  */
/* ------------------------------------------------------------------ */

const DEFAULT_CATALOG = {
  settings: {
    storeName: "LUNATHREADS",
    tagline: "Curated Everyday & Party Outfits",
    announcement: "New styles, thoughtfully curated",
    whatsapp: "7248152825",
    upiId: import.meta.env.VITE_UPI_ID || "ruslananwar0807@okaxis",
    upiName: import.meta.env.VITE_UPI_NAME || "LUNATHREADS",
    paymentTitle: "Pay by UPI — get free shipping",
    paymentDescription: "After we confirm your order on WhatsApp, pay with GPay, PhonePe, Paytm or any UPI app."
  },
  products: []
};

const PAGE_SIZE = 8;
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const discount = (p) => (Number(p.oldPrice) > Number(p.price) ? Math.round((1 - Number(p.price) / Number(p.oldPrice)) * 100) : 0);

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } }
};

/* ------------------------------------------------------------------ */
/*  Global styles (theme tokens, animations, reusable classes)          */
/* ------------------------------------------------------------------ */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');

:root{
  --bg:#FAF7F2; --bg-soft:#F2EDE5; --surface:#FFFFFF; --surface-2:#F7F3ED;
  --ink:#1A1523; --muted:#6E687A; --line:#E8E1D7;
  --accent:#5B3FD9; --accent-2:#8B5CF6; --accent-ink:#FFFFFF; --accent-soft:#EEEAFE;
  --gold:#B8892D; --danger:#D6455D; --success:#17936B;
  --shadow:0 18px 40px -22px rgba(52,34,110,.35); --shadow-sm:0 6px 18px -10px rgba(52,34,110,.25);
}
:root[data-theme="dark"]{
  --bg:#0D0C12; --bg-soft:#14121B; --surface:#17151F; --surface-2:#1E1B28;
  --ink:#F4F0FA; --muted:#A39DB3; --line:#2B2736;
  --accent:#A48BFF; --accent-2:#C4B5FD; --accent-ink:#120D24; --accent-soft:#251F40;
  --gold:#E6C06B; --danger:#FF6B85; --success:#4ADE9F;
  --shadow:0 18px 40px -20px rgba(0,0,0,.8); --shadow-sm:0 6px 18px -10px rgba(0,0,0,.7);
}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
::selection{background:var(--accent);color:var(--accent-ink)}

.font-display{font-family:'Playfair Display',Georgia,serif;letter-spacing:-.01em}
.t-ink{color:var(--ink)} .t-muted{color:var(--muted)} .t-accent{color:var(--accent)} .t-gold{color:var(--gold)} .t-danger{color:var(--danger)} .t-success{color:var(--success)}
.bg-app{background:var(--bg)} .bg-soft{background:var(--bg-soft)} .bg-surface{background:var(--surface)} .bg-surface2{background:var(--surface-2)}
.bd-line{border:1px solid var(--line)} .bt-line{border-top:1px solid var(--line)} .bb-line{border-bottom:1px solid var(--line)}
.glass{background:color-mix(in srgb,var(--bg) 80%,transparent);-webkit-backdrop-filter:blur(16px) saturate(170%);backdrop-filter:blur(16px) saturate(170%)}
.grad-text{background:linear-gradient(100deg,var(--accent),var(--accent-2) 45%,var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent;background-size:200% auto;animation:gradShift 8s linear infinite}
.line-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.no-scrollbar{scrollbar-width:none} .no-scrollbar::-webkit-scrollbar{display:none}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:999px;font-weight:600;font-size:.875rem;padding:.8rem 1.35rem;cursor:pointer;border:1px solid transparent;transition:transform .2s,box-shadow .25s,background .2s,border-color .2s,opacity .2s;white-space:nowrap}
.btn:active{transform:scale(.97)} .btn:disabled{opacity:.55;cursor:not-allowed}
.btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:var(--accent-ink);box-shadow:0 10px 24px -10px var(--accent)}
.btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 30px -10px var(--accent)}
.btn-ghost{background:var(--surface);border-color:var(--line);color:var(--ink)}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.btn-danger{border-color:color-mix(in srgb,var(--danger) 45%,transparent);color:var(--danger);background:transparent}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer;transition:all .2s;position:relative}
.icon-btn:hover{border-color:var(--accent);color:var(--accent);transform:translateY(-1px)}

.input{width:100%;border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:.72rem .95rem;color:var(--ink);outline:none;font-size:.9rem;transition:border-color .2s,box-shadow .2s}
.input::placeholder{color:var(--muted)}
.input:focus{border-color:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent)}

.chip{border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:.5rem 1rem;border-radius:999px;font-size:.8rem;font-weight:500;cursor:pointer;white-space:nowrap;transition:all .2s}
.chip:hover{border-color:var(--accent)}
.chip[data-on="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.size{min-width:3rem;padding:.65rem .9rem;border-radius:12px;border:1px solid var(--line);background:var(--surface);font-weight:600;font-size:.85rem;cursor:pointer;transition:all .2s}
.size:hover{border-color:var(--accent)}
.size[data-on="true"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);transform:translateY(-2px);box-shadow:0 10px 20px -12px var(--accent)}

.seg{display:inline-flex;padding:3px;border-radius:999px;border:1px solid var(--line);background:var(--surface)}
.seg button{width:32px;height:32px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;color:var(--muted);background:transparent;border:0;cursor:pointer;transition:all .25s}
.seg button[data-on="true"]{background:var(--accent);color:var(--accent-ink)}
.seg button:hover:not([data-on="true"]){color:var(--ink)}

.card{background:var(--surface);border:1px solid var(--line);border-radius:22px}

/* product card */
.pc{position:relative}
.pc-media{position:relative;aspect-ratio:3/4;border-radius:20px;overflow:hidden;background:var(--bg-soft);transition:box-shadow .35s,transform .35s}
.pc:hover .pc-media{box-shadow:var(--shadow);transform:translateY(-4px)}
.pc-img{transition:transform .8s cubic-bezier(.2,.7,.2,1)} .pc:hover .pc-img{transform:scale(1.07)}
.pc-cta{position:absolute;left:10px;right:10px;bottom:10px;padding:.6rem;border-radius:14px;text-align:center;font-size:.75rem;font-weight:600;background:color-mix(in srgb,var(--surface) 88%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:var(--ink);transform:translateY(130%);opacity:0;transition:transform .4s cubic-bezier(.2,.7,.2,1),opacity .3s}
.pc:hover .pc-cta{transform:translateY(0);opacity:1}
@media(hover:none){.pc-cta{display:none}}
.heart{position:absolute;top:10px;right:10px;z-index:5;width:36px;height:36px;border-radius:999px;display:flex;align-items:center;justify-content:center;border:0;cursor:pointer;background:color-mix(in srgb,var(--surface) 85%,transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:var(--ink);transition:transform .2s}
.heart:hover{transform:scale(1.12)} .heart[data-on="true"]{color:var(--danger)} .heart[data-on="true"] svg{fill:var(--danger);animation:heartPop .45s}
.badge{position:absolute;top:10px;left:10px;z-index:4;padding:.25rem .6rem;border-radius:999px;font-size:.68rem;font-weight:700;letter-spacing:.04em;background:var(--accent);color:var(--accent-ink)}
.badge-gold{background:var(--gold);color:#1a1523}

/* animations */
.reveal{opacity:0;transform:translateY(28px) scale(.98);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
.reveal.in{opacity:1;transform:none}
.page{animation:pageIn .55s cubic-bezier(.2,.7,.2,1) both}
.fade-up{animation:fadeUp .8s cubic-bezier(.2,.7,.2,1) both}
.skeleton{background:linear-gradient(100deg,var(--bg-soft) 30%,var(--surface-2) 50%,var(--bg-soft) 70%);background-size:200% 100%;animation:shimmer 1.4s linear infinite}
.marquee{display:flex;width:max-content;animation:marquee 32s linear infinite}
.marquee:hover{animation-play-state:paused}
.orb{position:absolute;border-radius:999px;filter:blur(70px);opacity:.5;animation:orbFloat 14s ease-in-out infinite}
.hero-card{position:absolute;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);border:6px solid var(--surface);animation:floaty 7s ease-in-out infinite;transition:z-index .1s}
.hero-card:hover{z-index:20!important}
.toast{animation:toastIn .4s cubic-bezier(.2,.9,.3,1.2) both}
.shake{animation:shake .45s}
.spin{animation:spin .8s linear infinite}
.modal-in{animation:modalIn .35s cubic-bezier(.2,.9,.3,1.1) both}
.acc{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s ease} .acc[data-open="true"]{grid-template-rows:1fr} .acc>div{overflow:hidden}

@keyframes fadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
@keyframes pageIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes shimmer{to{background-position:-200% 0}}
@keyframes marquee{to{transform:translateX(-50%)}}
@keyframes gradShift{to{background-position:200% center}}
@keyframes orbFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
@keyframes floaty{0%,100%{transform:translateY(0) rotate(var(--r))}50%{transform:translateY(-14px) rotate(var(--r))}}
@keyframes heartPop{0%{transform:scale(1)}40%{transform:scale(1.5)}100%{transform:scale(1)}}
@keyframes toastIn{from{opacity:0;transform:translate(-50%,-14px) scale(.95)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes modalIn{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}.reveal{opacity:1;transform:none}}
`;

/* ------------------------------------------------------------------ */
/*  Hooks                                                               */
/* ------------------------------------------------------------------ */

const Ctx = React.createContext(null);
const useApp = () => React.useContext(Ctx);

function parseRoute(path) {
  if (path === "/admin") return { name: "admin" };
  if (path === "/saved") return { name: "saved" };
  const m = path.match(/^\/product\/([^/]+)\/?$/);
  if (m) return { name: "product", id: decodeURIComponent(m[1]) };
  return { name: "home" };
}

function useRoute() {
  const [path, setPath] = useState(() => location.pathname);
  const fromPop = useRef(false);
  useEffect(() => {
    const onPop = () => { fromPop.current = true; setPath(location.pathname); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = useCallback((to, { scroll = true } = {}) => {
    fromPop.current = false;
    if (to !== location.pathname) history.pushState({}, "", to);
    setPath(location.pathname);
    if (scroll) window.scrollTo(0, 0);
  }, []);
  return { route: useMemo(() => parseRoute(path), [path]), navigate, fromPop };
}

function useTheme() {
  const [mode, setMode] = useState(() => store.get("luna:theme", "system")); // system by default
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  useEffect(() => { store.set("luna:theme", mode); }, [mode]);
  const resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    meta.content = resolved === "dark" ? "#0D0C12" : "#FAF7F2";
  }, [resolved]);
  return { mode, setMode, resolved };
}

function useReveal() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

function useInfinite(total, pageSize, resetKey, initial) {
  const [count, setCount] = useState(initial || pageSize);
  const [busy, setBusy] = useState(false);
  const sentinel = useRef(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setCount(pageSize);
  }, [resetKey, pageSize]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && count < total && !busy) {
        setBusy(true);
        setTimeout(() => { setCount((c) => Math.min(c + pageSize, total)); setBusy(false); }, 500);
      }
    }, { rootMargin: "700px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [count, total, busy, pageSize]);
  return { count, busy, sentinel, hasMore: count < total };
}

/* ------------------------------------------------------------------ */
/*  Small shared components                                             */
/* ------------------------------------------------------------------ */

function SmartImage({ src, alt, className = "", style }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setLoaded(false); setFailed(false); }, [src]);
  useEffect(() => { const el = ref.current; if (el && el.complete && el.naturalWidth) setLoaded(true); }, [src]);
  if (!src || failed) {
    return <div className="flex h-full w-full items-center justify-center bg-soft t-muted"><Moon size={28} strokeWidth={1.3} /></div>;
  }
  return (
    <img ref={ref} src={src} alt={alt || ""} loading="lazy" decoding="async" style={style}
      onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
      className={`h-full w-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"} ${className}`} />
  );
}

function ThemeToggle({ mode, setMode }) {
  const opts = [["light", Sun, "Light"], ["system", Monitor, "System"], ["dark", Moon, "Dark"]];
  return (
    <div className="seg" role="radiogroup" aria-label="Theme">
      {opts.map(([v, Icon, label]) => (
        <button key={v} role="radio" aria-checked={mode === v} aria-label={label} title={label} data-on={mode === v} onClick={() => setMode(v)}>
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div>
      <div className="skeleton rounded-[20px]" style={{ aspectRatio: "3/4" }} />
      <div className="skeleton mt-3 h-3.5 w-3/4 rounded-full" />
      <div className="skeleton mt-2 h-3.5 w-1/3 rounded-full" />
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bb-line">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold">
        {title}
        <ChevronDown size={18} className="t-muted transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      <div className="acc" data-open={open}><div><div className="pb-4 text-sm leading-6 t-muted">{children}</div></div></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product card + infinite grid                                        */
/* ------------------------------------------------------------------ */

function ProductCard({ p, index = 0 }) {
  const { navigate, wishlist, toggleWish, homeMemo } = useApp();
  const [ref, seen] = useReveal();
  const liked = wishlist.includes(p.id);
  const off = discount(p);
  return (
    <article ref={ref} className={`pc reveal ${seen ? "in" : ""}`} style={{ transitionDelay: `${(index % 4) * 70}ms` }}>
      <button className="heart" data-on={liked} aria-label={liked ? "Remove from saved" : "Save for later"} onClick={() => toggleWish(p.id)}>
        <Heart size={17} />
      </button>
      <a href={`/product/${p.id}`} className="block"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          homeMemo.current.y = window.scrollY;
          navigate(`/product/${p.id}`);
        }}>
        <div className="pc-media">
          <SmartImage src={p.image} alt={p.name} className="pc-img" />
          {off > 0 ? <span className="badge">{off}% OFF</span> : index < 3 && <span className="badge badge-gold">NEW</span>}
          <span className="pc-cta">View details →</span>
        </div>
        <div className="pt-3">
          {p.category && <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[.18em] t-muted">{p.category}</p>}
          <h3 className="truncate text-sm font-semibold">{p.name}</h3>
          <p className="mt-1 flex items-baseline gap-2 text-sm">
            <span className="font-bold">{money(p.price)}</span>
            {off > 0 && <span className="text-xs t-muted line-through">{money(p.oldPrice)}</span>}
          </p>
        </div>
      </a>
    </article>
  );
}

function InfiniteGrid({ items, resetKey, initial, onCount, compact = false }) {
  const inf = useInfinite(items.length, PAGE_SIZE, resetKey, initial);
  useEffect(() => { onCount && onCount(inf.count); }, [inf.count]); // eslint-disable-line
  const visible = items.slice(0, inf.count);
  const cols = compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  return (
    <>
      <div className={`grid gap-x-3 gap-y-8 sm:gap-x-5 ${cols}`}>
        {visible.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        {inf.busy && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk${i}`} />)}
      </div>
      <div ref={inf.sentinel} aria-hidden="true" className="h-10" />
      {!inf.hasMore && items.length > PAGE_SIZE && (
        <p className="py-6 text-center text-xs uppercase tracking-[.25em] t-muted">✦ You've seen everything ✦</p>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  UPI / payment card                                                  */
/* ------------------------------------------------------------------ */

function UpiCard() {
  const { catalog, notify } = useApp();
  const s = catalog.settings;
  async function copy() {
    try { await navigator.clipboard.writeText(s.upiId); notify("UPI ID copied"); }
    catch { notify(`UPI ID: ${s.upiId}`); }
  }
  function open() {
    window.location.href = `upi://pay?pa=${encodeURIComponent(s.upiId)}&pn=${encodeURIComponent(s.upiName)}&cu=INR`;
  }
  return (
    <section className="relative overflow-hidden rounded-[28px] bd-line bg-surface p-6 sm:p-9">
      <div className="orb" style={{ width: 260, height: 260, right: -60, top: -80, background: "var(--accent)", opacity: 0.22 }} />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-widest t-accent"><Truck size={13} /> Free shipping</span>
          <h2 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">{s.paymentTitle}</h2>
          <p className="mt-2 text-sm leading-6 t-muted">{s.paymentDescription}</p>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest t-muted">UPI ID</p>
          <p className="mt-1 break-all text-base font-bold">{s.upiId}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button onClick={copy} className="btn btn-ghost"><Copy size={15} /> Copy UPI ID</button>
          <button onClick={open} className="btn btn-primary">Open UPI app <ArrowUpRight size={15} /></button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Header / footer                                                     */
/* ------------------------------------------------------------------ */

function Header() {
  const { catalog, navigate, theme, wishlist, query, setQuery, route, progress, homeMemo } = useApp();
  const s = catalog.settings;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const goHome = (e) => { e.preventDefault(); homeMemo.current = { count: PAGE_SIZE, y: 0 }; navigate("/"); };
  return (
    <header className={`glass sticky top-0 z-40 transition-shadow ${scrolled ? "bb-line" : ""}`} style={{ borderBottom: scrolled ? undefined : "1px solid transparent" }}>
      <div className="absolute left-0 top-0 h-[2px] origin-left" style={{ width: "100%", transform: `scaleX(${progress})`, background: "linear-gradient(90deg,var(--accent),var(--gold))" }} />
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-8">
        <a href="/" onClick={goHome} className="flex shrink-0 items-center gap-2.5" aria-label={`${s.storeName} home`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}><Moon size={18} fill="currentColor" /></span>
          <span className="font-display text-base font-bold tracking-[.14em] sm:text-lg">{s.storeName}</span>
        </a>
        <div className="relative mx-auto hidden max-w-md flex-1 md:block">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 t-muted" />
          <input className="input" style={{ paddingLeft: "2.5rem", borderRadius: 999 }} placeholder="Search outfits…" value={query}
            onChange={(e) => { setQuery(e.target.value); if (route.name !== "home") navigate("/", { scroll: false }); }} />
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle mode={theme.mode} setMode={theme.setMode} />
          <a href="/saved" onClick={(e) => { e.preventDefault(); navigate("/saved"); }} className="icon-btn" aria-label={`Saved items (${wishlist.length})`}>
            <Heart size={17} />
            {wishlist.length > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: "var(--danger)", color: "#fff" }}>{wishlist.length}</span>}
          </a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { catalog, navigate } = useApp();
  const s = catalog.settings;
  const phone = String(s.whatsapp || "").replace(/\D/g, "");
  return (
    <footer className="bt-line bg-soft">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-bold tracking-[.14em]">{s.storeName}</p>
          <p className="mt-3 max-w-xs text-sm leading-6 t-muted">{s.tagline}. Pieces for everyday moments and special plans.</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] t-muted">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }} className="hover:t-accent">Shop all</a></li>
            <li><a href="/saved" onClick={(e) => { e.preventDefault(); navigate("/saved"); }}>Saved items</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] t-muted">Order & support</p>
          <p className="text-sm leading-6 t-muted">Tap any product and order in one message on WhatsApp. UPI or  .</p>
          {phone && <a className="btn btn-ghost mt-4" href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} /> Chat with us</a>}
        </div>
      </div>
      <div className="bt-line px-4 py-6 text-center text-xs t-muted">
        <button onClick={() => navigate("/admin")} className="transition hover:opacity-70">© {new Date().getFullYear()} {s.storeName}. All rights reserved.</button>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Home                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  const { catalog, navigate, homeMemo } = useApp();
  const s = catalog.settings;
  const featured = catalog.products.slice(0, 3);
  const phone = String(s.whatsapp || "").replace(/\D/g, "");
  const layout = [
    { left: "2%", top: 50, w: 210, r: "-7deg", z: 1, d: "0s" },
    { left: "30%", top: 0, w: 245, r: "2deg", z: 3, d: "-2s" },
    { left: "64%", top: 70, w: 205, r: "8deg", z: 2, d: "-4s" }
  ];
  return (
    <section className="relative overflow-hidden">
      <div className="orb" style={{ width: 380, height: 380, left: -120, top: -100, background: "var(--accent)" }} />
      <div className="orb" style={{ width: 320, height: 320, right: -80, top: 120, background: "var(--gold)", opacity: 0.28, animationDelay: "-6s" }} />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-2 lg:pb-20 lg:pt-20">
        <div className="text-center lg:text-left">
          <p className="fade-up inline-flex items-center gap-2 rounded-full bd-line bg-surface px-4 py-1.5 text-[11px] font-bold uppercase tracking-[.2em] t-muted"><Sparkles size={13} className="t-gold" /> The latest edit</p>
          <h1 className="font-display fade-up mt-5 text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl lg:text-7xl" style={{ animationDelay: ".08s" }}>
            Wear your kind of <span className="grad-text italic">beautiful.</span>
          </h1>
          <p className="fade-up mx-auto mt-5 max-w-lg text-[15px] leading-7 t-muted lg:mx-0" style={{ animationDelay: ".16s" }}>
            {s.tagline}. Discover handpicked pieces for everyday moments and special plans — order in one tap on WhatsApp.
          </p>
          <div className="fade-up mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start" style={{ animationDelay: ".24s" }}>
            <a href="#shop" className="btn btn-primary" onClick={(e) => { e.preventDefault(); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>Shop the collection <ChevronRight size={16} /></a>
            {phone && <a className="btn btn-ghost" href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Chat on WhatsApp</a>}
          </div>
        </div>
        <div className="relative hidden h-[470px] lg:block">
          {featured.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-60 w-60 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))", boxShadow: "0 0 90px -10px var(--accent)", animation: "floaty 7s ease-in-out infinite", "--r": "0deg" }}>
                <Moon size={110} strokeWidth={1.2} fill="currentColor" />
              </div>
            </div>
          ) : featured.map((p, i) => (
            <a key={p.id} href={`/product/${p.id}`} aria-label={p.name} className="hero-card"
              style={{ left: layout[i].left, top: layout[i].top, width: layout[i].w, aspectRatio: "3/4", zIndex: layout[i].z, "--r": layout[i].r, animationDelay: layout[i].d }}
              onClick={(e) => { e.preventDefault(); homeMemo.current.y = window.scrollY; navigate(`/product/${p.id}`); }}>
              <SmartImage src={p.image} alt={p.name} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [[Truck, "Free shipping", "On UPI payments"], [MessageCircle, "Order in one tap", "Via WhatsApp"], [ShieldCheck, " ", "  "], [Sparkles, "Curated drops", "Fresh styles often"]];
  return (
    <section className="bt-line bb-line bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-5 px-4 py-6 sm:px-8 md:grid-cols-4">
        {items.map(([Icon, t, d]) => (
          <div key={t} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] t-accent"><Icon size={18} /></span>
            <div><p className="text-[13px] font-semibold leading-tight">{t}</p><p className="text-xs t-muted">{d}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomeView() {
  const { catalog, loading, query, setQuery, category, setCategory, sort, setSort, homeMemo, fromPop } = useApp();
  const categories = useMemo(() => ["All", ...Array.from(new Set(catalog.products.map((p) => (p.category || "").trim()).filter(Boolean)))], [catalog.products]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = catalog.products.filter((p) =>
      (category === "All" || (p.category || "").trim() === category) &&
      (!q || `${p.name} ${p.description || ""} ${p.category || ""}`.toLowerCase().includes(q)));
    if (sort === "low") items = [...items].sort((a, b) => a.price - b.price);
    if (sort === "high") items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [catalog.products, query, category, sort]);

  const restore = fromPop.current && homeMemo.current.y > 0;
  useEffect(() => {
    if (restore) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, homeMemo.current.y)));
  }, []); // eslint-disable-line

  return (
    <div className="page">
      <Hero />
      <TrustStrip />
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <section id="shop" className="scroll-mt-20 pt-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.22em] t-accent">Curated for you</p>
              <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Shop the collection</h2>
            </div>
            <span className="hidden text-sm t-muted sm:block">{list.length} {list.length === 1 ? "style" : "styles"}</span>
          </div>

          <div className="glass sticky top-16 z-30 -mx-4 mb-8 px-4 py-3 sm:-mx-8 sm:px-8">
            <div className="relative mb-3 md:hidden">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 t-muted" />
              <input className="input" style={{ paddingLeft: "2.5rem", borderRadius: 999 }} placeholder="Search outfits…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
                {categories.map((c) => <button key={c} className="chip" data-on={category === c} onClick={() => setCategory(c)}>{c}</button>)}
              </div>
              <select aria-label="Sort products" className="input !w-auto !rounded-full !py-2 text-xs" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="new">Newest</option>
                <option value="low">Price: Low → High</option>
                <option value="high">Price: High → Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : catalog.products.length === 0 ? (
            <div className="card p-12 text-center"><ShoppingBag className="mx-auto mb-3 t-muted" size={30} /><h3 className="font-semibold">The collection is being curated</h3><p className="mt-2 text-sm t-muted">New outfits will appear here soon.</p></div>
          ) : list.length === 0 ? (
            <div className="card p-12 text-center">
              <Search className="mx-auto mb-3 t-muted" size={28} />
              <h3 className="font-semibold">No styles match your search</h3>
              <button className="btn btn-ghost mt-5" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button>
            </div>
          ) : (
            <InfiniteGrid items={list} resetKey={`${query}|${category}|${sort}`} initial={restore ? homeMemo.current.count : PAGE_SIZE} onCount={(c) => { homeMemo.current.count = c; }} />
          )}
        </section>
        <div className="mt-14"><UpiCard /></div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Saved                                                               */
/* ------------------------------------------------------------------ */

function SavedView() {
  const { catalog, wishlist, navigate } = useApp();
  const items = wishlist.map((id) => catalog.products.find((p) => p.id === id)).filter(Boolean);
  return (
    <main className="page mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[.22em] t-accent">Your picks</p>
      <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Saved items</h1>
      <p className="mt-2 text-sm t-muted">Stored on this device — no account needed.</p>
      <div className="mt-8">
        {items.length === 0 ? (
          <div className="card p-12 text-center">
            <Heart className="mx-auto mb-3 t-muted" size={30} />
            <h3 className="font-semibold">Nothing saved yet</h3>
            <p className="mt-2 text-sm t-muted">Tap the heart on any outfit to keep it here.</p>
            <button className="btn btn-primary mt-6" onClick={() => navigate("/")}>Start browsing</button>
          </div>
        ) : <InfiniteGrid items={items} resetKey="saved" />}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Product page                                                        */
/* ------------------------------------------------------------------ */

function ProductPage({ id }) {
  const { catalog, loading, navigate, wishlist, toggleWish, sizePick, setPick, order, notify, pushRecent, recent } = useApp();
  const p = catalog.products.find((x) => x.id === id);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (p) pushRecent(p.id); }, [p?.id]); // eslint-disable-line

  const others = useMemo(() => {
    if (!p) return [];
    const rest = catalog.products.filter((x) => x.id !== p.id);
    return [...rest.filter((x) => p.category && x.category === p.category), ...rest.filter((x) => !(p.category && x.category === p.category))];
  }, [catalog.products, p]);
  const recents = useMemo(() => recent.map((rid) => catalog.products.find((x) => x.id === rid)).filter((x) => x && x.id !== id).slice(0, 8), [recent, catalog.products, id]);

  if (loading) {
    return <main className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2"><div className="skeleton rounded-3xl" style={{ aspectRatio: "4/5" }} /><div className="space-y-4"><div className="skeleton h-8 w-2/3 rounded-full" /><div className="skeleton h-6 w-1/4 rounded-full" /><div className="skeleton h-28 w-full rounded-2xl" /></div></main>;
  }
  if (!p) {
    return (
      <main className="page mx-auto max-w-xl px-4 py-24 text-center">
        <ShoppingBag className="mx-auto mb-4 t-muted" size={34} />
        <h1 className="font-display text-3xl font-semibold">Product not found</h1>
        <p className="mt-2 text-sm t-muted">This style may have been removed.</p>
        <button className="btn btn-primary mt-6" onClick={() => navigate("/")}>Back to store</button>
      </main>
    );
  }

  const sizes = p.sizes || [];
  const picked = sizePick[p.id] || "";
  const liked = wishlist.includes(p.id);
  const off = discount(p);

  function tryOrder() {
    const ok = order(p);
    if (!ok) { setShake(true); setTimeout(() => setShake(false), 500); }
  }
  async function share() {
    const url = `${location.origin}/product/${p.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: p.name, text: `${p.name} — ${money(p.price)}`, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 1800); notify("Link copied");
    } catch { /* user cancelled */ }
  }

  return (
    <div className="page pb-24 lg:pb-0">
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-8">
        <nav className="mb-5 flex items-center gap-2 text-xs t-muted" aria-label="Breadcrumb">
          <button onClick={() => window.history.length > 1 ? window.history.back() : navigate("/")} className="inline-flex items-center gap-1.5 font-medium hover:t-accent"><ArrowLeft size={14} /> Back</button>
          <span>/</span><a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Shop</a>
          {p.category && <><span>/</span><span>{p.category}</span></>}
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-[28px] bg-soft" style={{ aspectRatio: "4/5", cursor: zoom.on ? "zoom-out" : "zoom-in" }}
              onMouseEnter={() => setZoom((z) => ({ ...z, on: true }))} onMouseLeave={() => setZoom({ on: false, x: 50, y: 50 })}
              onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ on: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}>
              <SmartImage src={p.image} alt={p.name} style={{ transform: zoom.on ? "scale(1.9)" : "scale(1)", transformOrigin: `${zoom.x}% ${zoom.y}%`, transition: zoom.on ? "transform .15s ease-out" : "transform .5s ease" }} />
              {off > 0 && <span className="badge" style={{ top: 16, left: 16 }}>{off}% OFF</span>}
            </div>
          </div>

          <div className="lg:py-4">
            {p.category && <p className="text-xs font-bold uppercase tracking-[.22em] t-accent">{p.category}</p>}
            <h1 className="font-display mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{p.name}</h1>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold">{money(p.price)}</span>
              {off > 0 && <><span className="text-lg t-muted line-through">{money(p.oldPrice)}</span><span className="rounded-full px-2.5 py-0.5 text-xs font-bold t-success" style={{ background: "color-mix(in srgb,var(--success) 14%,transparent)" }}>Save {off}%</span></>}
            </div>
            <p className="mt-1 text-xs t-muted">Inclusive of all taxes · Free shipping on UPI</p>
            {p.description && <p className="mt-5 text-[15px] leading-7 t-muted">{p.description}</p>}

            {sizes.length > 0 && (
              <div className={`mt-7 ${shake ? "shake" : ""}`}>
                <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Select size {picked && <span className="t-muted font-normal">· {picked}</span>}</p></div>
                <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Size">
                  {sizes.map((s) => <button key={s} role="radio" aria-checked={picked === s} data-on={picked === s} className="size" onClick={() => setPick(p.id, s)}>{s}</button>)}
                </div>
              </div>
            )}

            <div className="mt-8 hidden gap-3 lg:flex">
              <button onClick={tryOrder} className="btn btn-primary flex-1 !py-4 !text-[15px]"><MessageCircle size={18} /> Order on WhatsApp</button>
              <button onClick={() => toggleWish(p.id)} className="icon-btn !h-[54px] !w-[54px]" aria-label="Save" style={liked ? { color: "var(--danger)", borderColor: "var(--danger)" } : undefined}><Heart size={20} fill={liked ? "currentColor" : "none"} /></button>
              <button onClick={share} className="icon-btn !h-[54px] !w-[54px]" aria-label="Share">{copied ? <Check size={20} /> : <Share2 size={20} />}</button>
            </div>
            <div className="mt-4 flex gap-3 lg:hidden">
              <button onClick={() => toggleWish(p.id)} className="btn btn-ghost flex-1" style={liked ? { color: "var(--danger)" } : undefined}><Heart size={16} fill={liked ? "currentColor" : "none"} /> {liked ? "Saved" : "Save"}</button>
              <button onClick={share} className="btn btn-ghost flex-1"><Share2 size={16} /> Share</button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 text-center text-[11px] font-medium t-muted">
              {[[Truck, "Free shipping on UPI"], [ShieldCheck, " "], [MessageCircle, "Easy WhatsApp help"]].map(([Icon, t]) => (
                <div key={t} className="rounded-2xl bd-line bg-surface px-2 py-4"><Icon size={20} className="mx-auto mb-2 t-accent" />{t}</div>
              ))}
            </div>

            <div className="mt-8 bt-line">
              <Accordion title="Product details" defaultOpen>{p.description || "Handpicked and quality-checked before it reaches you."}{sizes.length > 0 && <> Available sizes: {sizes.join(", ")}.</>}</Accordion>
              <Accordion title="How to order">Choose your size, tap “Order on WhatsApp”, and we'll confirm availability and delivery details with you in chat.</Accordion>
              <Accordion title="Payment & delivery">{catalog.settings.paymentDescription}   is also available.</Accordion>
            </div>
          </div>
        </div>

        {recents.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display mb-5 flex items-center gap-2 text-2xl font-semibold"><Clock size={20} className="t-muted" /> Recently viewed</h2>
            <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
              {recents.map((r) => (
                <a key={r.id} href={`/product/${r.id}`} onClick={(e) => { e.preventDefault(); navigate(`/product/${r.id}`); }} className="w-36 shrink-0 sm:w-44">
                  <div className="overflow-hidden rounded-2xl bg-soft" style={{ aspectRatio: "3/4" }}><SmartImage src={r.image} alt={r.name} /></div>
                  <p className="mt-2 truncate text-sm font-semibold">{r.name}</p><p className="text-sm t-muted">{money(r.price)}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section className="mt-16 pb-16">
            <p className="text-xs font-semibold uppercase tracking-[.22em] t-accent">Keep exploring</p>
            <h2 className="font-display mb-8 mt-2 text-3xl font-semibold">You may also like</h2>
            <InfiniteGrid items={others} resetKey={p.id} />
          </section>
        )}
      </main>

      <div className="glass bt-line fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 px-4 py-3 lg:hidden" style={{ paddingBottom: "max(.75rem, env(safe-area-inset-bottom))" }}>
        <div className="min-w-0"><p className="text-lg font-bold leading-none">{money(p.price)}</p>{off > 0 && <p className="mt-1 text-[11px] t-muted line-through">{money(p.oldPrice)}</p>}</div>
        <button onClick={tryOrder} className="btn btn-primary flex-1"><MessageCircle size={16} /> Order on WhatsApp</button>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-8"><UpiCard /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin                                                               */
/* ------------------------------------------------------------------ */

const emptyProduct = () => ({ id: "", name: "", price: "", oldPrice: "", category: "", description: "", sizes: "S, M, L, XL", image: "" });

function AdminView() {
  const { catalog, setCatalog, adminToken, setAdminToken, saving, setSaving, apiSave, notify, navigate } = useApp();
  const [password, setPassword] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(emptyProduct());

  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => e.key === "Escape" && setModal(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [modal]);

  async function login(e) {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login failed");
      setAdminToken(result.token); setPassword(""); notify("Admin access granted.");
    } catch (error) { notify(error.message || "Incorrect admin password."); }
  }

  function chooseImage(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return notify("Please use an image smaller than 5 MB.");
    if (!adminToken) return notify("Please log in to admin first.");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setSaving(true);
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ mime: file.type, dataUrl: reader.result })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Image upload failed.");
        setDraft((d) => ({ ...d, image: result.image }));
        notify("Image saved in public/images.");
      } catch (error) { notify(error.message || "Could not upload image."); }
      finally { setSaving(false); }
    };
    reader.onerror = () => notify("Could not read the selected image.");
    reader.readAsDataURL(file);
  }

  function exportCatalog() {
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lunathreads-catalog.json"; a.click();
    URL.revokeObjectURL(url);
    notify("JSON catalogue downloaded.");
  }
  function importCatalog(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.products) || !data.settings) throw new Error("Invalid catalogue JSON");
        await apiSave({ ...DEFAULT_CATALOG, ...data, settings: { ...DEFAULT_CATALOG.settings, ...data.settings } });
      } catch { notify("That JSON file is not a valid LUNATHREADS catalogue."); }
    };
    reader.readAsText(file);
  }

  const startAdd = () => { setEditing(null); setDraft(emptyProduct()); setModal(true); };
  const startEdit = (p) => { setEditing(p.id); setDraft({ ...emptyProduct(), ...p, sizes: (p.sizes || []).join(", ") }); setModal(true); };
  async function saveProduct(e) {
    e.preventDefault();
    const product = {
      ...draft,
      id: editing || uid(),
      price: Number(draft.price),
      oldPrice: draft.oldPrice === "" || draft.oldPrice == null ? undefined : Number(draft.oldPrice),
      category: (draft.category || "").trim(),
      sizes: String(draft.sizes).split(",").map((s) => s.trim()).filter(Boolean)
    };
    const products = editing ? catalog.products.map((p) => (p.id === editing ? product : p)) : [product, ...catalog.products];
    if (await apiSave({ ...catalog, products })) setModal(false);
  }
  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    await apiSave({ ...catalog, products: catalog.products.filter((p) => p.id !== id) });
  }

  const setting = (key, value) => setCatalog((c) => ({ ...c, settings: { ...c.settings, [key]: value } }));
  const fields = [["storeName", "Store name"], ["tagline", "Tagline"], ["announcement", "Announcement bar"], ["whatsapp", "WhatsApp number (country code + number, digits only)"], ["upiId", "UPI ID"], ["upiName", "UPI payee name"], ["paymentTitle", "Payment heading"], ["paymentDescription", "Payment description"]];

  return (
    <main className="page mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[.22em] t-muted">Store control</p><h1 className="font-display mt-2 text-3xl font-semibold">Admin dashboard</h1></div>
        <button onClick={() => navigate("/")} className="btn btn-ghost">View store</button>
      </div>

      {!adminToken ? (
        <form onSubmit={login} className="card max-w-md p-6">
          <div className="mb-4 flex items-center gap-2"><Lock size={18} /><h2 className="font-semibold">Admin login</h2></div>
          <label className="mb-2 block text-sm t-muted" htmlFor="adminpw">Admin password</label>
          <input id="adminpw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Enter admin password" />
          <button className="btn btn-primary mt-4 w-full">Unlock admin</button>
          <p className="mt-3 text-xs t-muted">Set ADMIN_PASSWORD on the Node server. The password is checked by the backend.</p>
        </form>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <button onClick={startAdd} className="btn btn-primary"><Plus size={16} /> Add product</button>
            <button onClick={exportCatalog} className="btn btn-ghost">Export JSON</button>
            <label className="btn btn-ghost cursor-pointer">Import JSON<input type="file" accept="application/json,.json" className="hidden" onChange={(e) => importCatalog(e.target.files?.[0])} /></label>
            <button onClick={() => { setAdminToken(""); navigate("/"); }} className="btn btn-ghost"><LogOut size={16} /> Log out</button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); apiSave(catalog); }} className="card mb-8 grid gap-4 p-6 md:grid-cols-2">
            <h2 className="text-lg font-semibold md:col-span-2">Store & payment settings</h2>
            {fields.map(([key, label]) => (
              <label key={key} className="block text-sm font-medium">{label}
                {key === "paymentDescription"
                  ? <textarea rows="3" value={catalog.settings[key] || ""} onChange={(e) => setting(key, e.target.value)} className="input mt-2" />
                  : <input value={catalog.settings[key] || ""} onChange={(e) => setting(key, e.target.value)} className="input mt-2" />}
              </label>
            ))}
            <button disabled={saving} className="btn btn-primary md:col-span-2">{saving ? "Saving…" : "Save settings"}</button>
          </form>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Products ({catalog.products.length})</h2>
            {catalog.products.length === 0 && <p className="card p-6 t-muted">No products yet. Click “Add product” to publish your first outfit.</p>}
            {catalog.products.map((p) => (
              <div key={p.id} className="card flex items-center gap-4 p-3">
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-soft"><SmartImage src={p.image} alt="" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-sm t-muted">{money(p.price)}{p.category ? ` · ${p.category}` : ""} · {(p.sizes || []).join(", ")}</p>
                </div>
                <button onClick={() => startEdit(p)} className="icon-btn" aria-label="Edit"><Pencil size={16} /></button>
                <button onClick={() => deleteProduct(p.id)} className="icon-btn t-danger" aria-label="Delete"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && setModal(false)}>
          <form onSubmit={saveProduct} className="card modal-in my-8 w-full max-w-lg p-6" style={{ boxShadow: "var(--shadow)" }}>
            <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{editing ? "Edit product" : "Add product"}</h2><button type="button" onClick={() => setModal(false)} className="icon-btn" aria-label="Close"><X size={16} /></button></div>
            <div className="space-y-4">
              <label className="block text-sm font-medium">Product name<input required value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="input mt-1" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">Price (INR)<input required type="number" min="0" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} className="input mt-1" /></label>
                <label className="block text-sm font-medium">Old price (optional)<input type="number" min="0" value={draft.oldPrice ?? ""} onChange={(e) => setDraft((d) => ({ ...d, oldPrice: e.target.value }))} className="input mt-1" placeholder="For discount badge" /></label>
              </div>
              <label className="block text-sm font-medium">Category (optional)
                <input list="luna-cats" value={draft.category || ""} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} className="input mt-1" placeholder="Dresses, Tops, Co-ords…" />
                <datalist id="luna-cats">{["Dresses", "Tops", "Co-ords", "Party Wear", "Ethnic", "Casual"].map((c) => <option key={c} value={c} />)}</datalist>
              </label>
              <label className="block text-sm font-medium">Description<textarea rows="3" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} className="input mt-1" /></label>
              <label className="block text-sm font-medium">Sizes (comma separated)<input value={draft.sizes} onChange={(e) => setDraft((d) => ({ ...d, sizes: e.target.value }))} className="input mt-1" placeholder="S, M, L, XL" /></label>
              <label className="btn btn-ghost !flex !w-full cursor-pointer !rounded-2xl !border-dashed !py-4"><Upload size={17} /> {saving ? "Uploading…" : draft.image ? "Change product image" : "Upload product image"}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" disabled={saving} onChange={(e) => chooseImage(e.target.files?.[0])} />
              </label>
              {draft.image && <img src={draft.image} alt="Product preview" className="h-44 w-full rounded-2xl object-cover" />}
            </div>
            <button disabled={saving} className="btn btn-primary mt-6 w-full">{saving ? "Saving…" : "Save product"}</button>
          </form>
        </div>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  App root                                                            */
/* ------------------------------------------------------------------ */

function App() {
  const theme = useTheme();
  const { route, navigate, fromPop } = useRoute();
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [saving, setSaving] = useState(false);

  // persisted in localStorage
  const [wishlist, setWishlist] = useState(() => store.get("luna:wishlist", []));
  const [recent, setRecent] = useState(() => store.get("luna:recent", []));
  const [sizePick, setSizePick] = useState(() => store.get("luna:sizes", {}));
  const [sort, setSort] = useState(() => store.get("luna:sort", "new"));
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  useEffect(() => { store.set("luna:wishlist", wishlist); }, [wishlist]);
  useEffect(() => { store.set("luna:recent", recent); }, [recent]);
  useEffect(() => { store.set("luna:sizes", sizePick); }, [sizePick]);
  useEffect(() => { store.set("luna:sort", sort); }, [sort]);

  const homeMemo = useRef({ count: PAGE_SIZE, y: 0 });
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const noticeTimer = useRef(null);

  const notify = useCallback((msg) => {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 2400);
  }, []);

  useEffect(() => {
    fetch("/api/catalog")
      .then(async (r) => { if (!r.ok) throw new Error("Could not load catalogue"); return r.json(); })
      .then((saved) => setCatalog({ ...DEFAULT_CATALOG, ...saved, settings: { ...DEFAULT_CATALOG.settings, ...(saved.settings || {}) }, products: saved.products || [] }))
      .catch((e) => { console.error(e); notify("Could not connect to the store server."); })
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(() => {
    let ticking = false;
    const on = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        setShowTop(window.scrollY > 700);
        ticking = false;
      });
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // document title per route
  useEffect(() => {
    const name = catalog.settings.storeName;
    if (route.name === "product") {
      const p = catalog.products.find((x) => x.id === route.id);
      document.title = p ? `${p.name} · ${name}` : name;
    } else if (route.name === "saved") document.title = `Saved · ${name}`;
    else if (route.name === "admin") document.title = `Admin · ${name}`;
    else document.title = `${name} — ${catalog.settings.tagline}`;
  }, [route, catalog]);

  const toggleWish = useCallback((id) => {
    const has = wishlist.includes(id);
    setWishlist(has ? wishlist.filter((x) => x !== id) : [id, ...wishlist]);
    notify(has ? "Removed from saved" : "Saved for later");
  }, [wishlist, notify]);
  const pushRecent = useCallback((id) => setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 12)), []);
  const setPick = useCallback((id, size) => setSizePick((s) => ({ ...s, [id]: size })), []);

  function order(product) {
    const sizes = product.sizes || [];
    const size = sizePick[product.id];
    if (sizes.length && !size) { notify("Please choose a size first."); return false; }
    const phone = String(catalog.settings.whatsapp || "").replace(/\D/g, "");
    if (!phone) { notify("Store WhatsApp number is not configured yet."); return false; }
    const message = `Hi ${catalog.settings.storeName}! I'd like to order:\n\n*${product.name}*${size ? `\nSize: ${size}` : ""}\nPrice: ${money(product.price)}\nLink: ${location.origin}/product/${product.id}\n\nPayment: UPI or  `;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    return true;
  }

  async function apiSave(next) {
    if (!adminToken) { notify("Please log in to admin first."); return false; }
    setSaving(true);
    try {
      const response = await fetch("/api/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(next)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed");
      setCatalog(result);
      notify("Saved to data/products.json.");
      return true;
    } catch (error) { notify(error.message || "Could not save catalogue."); return false; }
    finally { setSaving(false); }
  }

  const ctx = {
    catalog, setCatalog, loading, navigate, route, fromPop, theme, wishlist, toggleWish, recent, pushRecent,
    sizePick, setPick, order, notify, query, setQuery, category, setCategory, sort, setSort,
    homeMemo, progress, adminToken, setAdminToken, saving, setSaving, apiSave
  };

  const announcement = catalog.settings.announcement;

  return (
    <Ctx.Provider value={ctx}>
      <style>{STYLES}</style>
      <div className="min-h-screen bg-app t-ink">
        {announcement && route.name !== "admin" && (
          <div className="overflow-hidden py-2 text-[11px] font-semibold uppercase tracking-[.22em]" style={{ background: "var(--ink)", color: "var(--bg)" }} aria-label="Announcement">
            <div className="marquee">
              {Array.from({ length: 12 }).map((_, i) => <span key={i} className="px-8">{announcement} <span className="t-gold">✦</span></span>)}
            </div>
          </div>
        )}
        <Header />
        {route.name === "admin" ? <AdminView />
          : route.name === "saved" ? <SavedView />
          : route.name === "product" ? <ProductPage key={route.id} id={route.id} />
          : <HomeView />}
        <Footer />

        <button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`icon-btn fixed right-4 z-30 shadow-lg transition-all duration-300 sm:right-6 ${route.name === "product" ? "bottom-24 lg:bottom-6" : "bottom-6"} ${showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
          style={{ background: "var(--accent)", color: "var(--accent-ink)", borderColor: "transparent" }}>
          <ArrowUp size={18} />
        </button>

        {notice && <div role="status" className="toast fixed left-1/2 top-20 z-[60] max-w-[90vw] rounded-full px-5 py-3 text-sm font-medium shadow-2xl" style={{ background: "var(--ink)", color: "var(--bg)" }}>{notice}</div>}
      </div>
    </Ctx.Provider>
  );
}

export default App;