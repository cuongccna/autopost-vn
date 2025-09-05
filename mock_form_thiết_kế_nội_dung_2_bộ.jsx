import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Type as TypeIcon,
  Image as ImageIcon,
  Palette,
  Layers,
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  Video as VideoIcon,
  Sparkles,
  Hash,
  Download,
  Settings2,
  SquareStack,
  Rows3,
  Wand2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// --- Small UI atoms (plain Tailwind) ---
const Button = ({ children, onClick, variant = "primary", className = "", type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-3 py-2 rounded-2xl text-sm font-medium shadow-sm transition hover:shadow-md active:scale-[0.99] ${
      variant === "primary"
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : variant === "outline"
        ? "border border-gray-300 text-gray-800 hover:bg-gray-50"
        : variant === "ghost"
        ? "text-gray-600 hover:bg-gray-100"
        : "bg-gray-200"
    } ${className}`}
  >
    {children}
  </button>
);

const Field = ({ label, hint, children, required }) => (
  <label className="block">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      {required ? <span className="text-red-500 text-xs">*</span> : null}
    </div>
    {children}
    {hint ? <p className="text-xs text-gray-500 mt-1 leading-snug">{hint}</p> : null}
  </label>
);

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs border transition ${
      checked ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-300 text-gray-700"
    }`}
  >
    <span className={`inline-block w-2 h-2 rounded-full ${checked ? "bg-emerald-500" : "bg-gray-300"}`} />
    {label}
  </button>
);

const ToolbarButton = ({ icon: Icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition ${
      active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// --- Helpers ---
const RATIOS = ["1:1", "4:5", "9:16", "16:9"];
const aspectDims = (ratio) => {
  switch (ratio) {
    case "1:1":
      return { w: 320, h: 320 };
    case "4:5":
      return { w: 320, h: 400 };
    case "9:16":
      return { w: 300, h: 533 };
    case "16:9":
      return { w: 480, h: 270 };
    default:
      return { w: 320, h: 320 };
  }
};

const TemplateCard = ({ tpl, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(tpl)}
    className={`group relative rounded-2xl border overflow-hidden text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      selected ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200"
    }`}
  >
    <div className="bg-gradient-to-br from-gray-50 to-white p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-800">{tpl.name}</div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-white text-gray-600">{tpl.ratio}</span>
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-2">
        <div className="h-20 w-full rounded-lg bg-gray-100 grid place-items-center text-gray-400 text-xs">Preview</div>
      </div>
    </div>
  </button>
);

// --- Form 1: Bài đăng Mạng Xã Hội (Ảnh / Carousel) ---
const SocialPostForm = () => {
  const [platform, setPlatform] = useState("Instagram");
  const [ratio, setRatio] = useState("1:1");
  const [title, setTitle] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [cta, setCta] = useState("Mua ngay");
  const [gridOn, setGridOn] = useState(false);
  const [safeAreaOn, setSafeAreaOn] = useState(true);
  const [brandColor, setBrandColor] = useState("#0ea5e9");
  const [template, setTemplate] = useState(null);
  const templates = [
    { id: "promo", name: "Flash Promo", ratio: "1:1" },
    { id: "launch", name: "Ra mắt sản phẩm", ratio: "4:5" },
    { id: "quote", name: "Trích dẫn thương hiệu", ratio: "1:1" },
    { id: "carousel", name: "Carousel 5 slides", ratio: "4:5" },
  ];

  const dims = aspectDims(ratio);

  const autoCaption = () => {
    const sample = `🔥 Ưu đãi chỉ hôm nay! ${title || "Sản phẩm hot"} giảm 30%.\n✅ Freeship đơn từ 199k\n👉 ${cta}`;
    setPrimaryText(sample);
  };

  const autoHashtags = () => {
    const hs = ["#sale", "#deal", "#vietnam", "#shopping", "#insta", "#trend"]; // demo
    setHashtags(hs.join(" "));
  };

  const exportJSON = () => {
    const data = {
      type: "social_post",
      platform,
      ratio,
      title,
      primaryText,
      hashtags,
      cta,
      gridOn,
      safeAreaOn,
      brandColor,
      template: template?.id || null,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `social_post_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Controls */}
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["Facebook", "Instagram", "TikTok", "YouTube"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`px-3 py-2 rounded-xl text-sm border transition ${
                platform === p
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton icon={TypeIcon} label="Văn bản" />
          <ToolbarButton icon={ImageIcon} label="Ảnh" />
          <ToolbarButton icon={Palette} label="Màu sắc" />
          <ToolbarButton icon={Layers} label="Lớp" />
          <ToolbarButton icon={SquareStack} label="Khung" />
          <ToolbarButton icon={Rows3} label="Carousel" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Tỉ lệ khung hình" hint="Gợi ý theo nền tảng">
            <select className="w-full border rounded-xl px-3 py-2" value={ratio} onChange={(e) => setRatio(e.target.value)}>
              {RATIOS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Màu thương hiệu">
            <input type="color" className="w-full h-10 border rounded-xl p-0" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Tiêu đề / Hook" required>
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Ví dụ: Siêu sale 9.9" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="CTA (Lời kêu gọi hành động)">
            <input className="w-full border rounded-xl px-3 py-2" placeholder="Ví dụ: Mua ngay" value={cta} onChange={(e) => setCta(e.target.value)} />
          </Field>
        </div>

        <Field label="Nội dung chính (Caption)" hint="Có thể tự động gợi ý bằng AI">
          <textarea className="w-full border rounded-2xl px-3 py-2 min-h-[96px]" placeholder="Viết nội dung..." value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} />
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={autoCaption}>
              <Sparkles className="w-4 h-4 mr-1" /> Gợi ý caption (AI)
            </Button>
            <Button variant="outline" onClick={autoHashtags}>
              <Hash className="w-4 h-4 mr-1" /> Sinh hashtag
            </Button>
          </div>
        </Field>

        <Field label="Hashtags">
          <input className="w-full border rounded-xl px-3 py-2" placeholder="#sale #deal #vietnam..." value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
        </Field>

        <div className="flex flex-wrap items-center gap-2">
          <Toggle checked={gridOn} onChange={setGridOn} label="Hiển thị lưới" />
          <Toggle checked={safeAreaOn} onChange={setSafeAreaOn} label="Vùng an toàn chữ" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800">Chọn template</h4>
            <Button variant="ghost" onClick={() => setTemplate(null)}>
              Bỏ chọn
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                tpl={tpl}
                selected={template?.id === tpl.id}
                onSelect={(t) => {
                  setTemplate(t);
                  setRatio(t.ratio);
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={exportJSON}>
            <Download className="w-4 h-4 mr-1" /> Xuất cấu hình JSON
          </Button>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-1" /> Lên lịch đăng
          </Button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost">
            <Smartphone className="w-4 h-4 mr-1" /> Mobile
          </Button>
          <Button variant="ghost">
            <Tablet className="w-4 h-4 mr-1" /> Tablet
          </Button>
          <Button variant="ghost">
            <Monitor className="w-4 h-4 mr-1" /> Desktop
          </Button>
          <div className="ml-auto text-sm text-gray-500">
            Nền tảng: <span className="font-medium text-gray-700">{platform}</span>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-4">
          <div className="relative mx-auto rounded-2xl overflow-hidden shadow" style={{ width: dims.w, height: dims.h, background: "#f8fafc" }}>
            {/* Safe area */}
            {safeAreaOn && <div className="absolute inset-3 rounded-xl border-2 border-dashed border-emerald-300 pointer-events-none" />}
            {/* Grid */}
            {gridOn && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-gray-200" />
                ))}
              </div>
            )}

            {/* Mock background */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${brandColor}33, #ffffff)` }} />

            {/* Mock heading */}
            <div className="absolute top-4 left-4 right-4">
              <h3 className="text-white drop-shadow text-xl font-extrabold uppercase tracking-wide">{title || "TIÊU ĐỀ / HOOK"}</h3>
            </div>

            {/* Mock body */}
            <div className="absolute left-4 right-4 bottom-4">
              <p className="bg-white/90 rounded-xl px-3 py-2 text-sm text-gray-800 line-clamp-4">
                {primaryText || "Viết nội dung caption tại đây. Sử dụng AI để gợi ý nhanh và tối ưu hoá cho nền tảng!"}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-gray-700">{hashtags || "#hashtag #brand #sale"}</span>
                <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full bg-blue-600 text-white">{cta}</span>
              </div>
            </div>
          </div>

          <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" /> Kiểm tra độ dài caption, cấm từ nhạy cảm
            </li>
            <li className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Thống nhất màu chữ / tương phản ≥ 4.5
            </li>
            <li className="flex items-center gap-2">
              <Hash className="w-4 h-4" /> 3-8 hashtag, có branded tag
            </li>
            <li className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Gợi ý khung giờ đăng theo nền tảng
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// --- Form 2: Video / Reel / Shorts ---
const VideoReelForm = () => {
  const [platform, setPlatform] = useState("TikTok");
  const [ratio, setRatio] = useState("9:16");
  const [duration, setDuration] = useState(15);
  const [hook, setHook] = useState("");
  const [beats, setBeats] = useState([
    { t: 0, label: "Hook" },
    { t: 5, label: "Value" },
    { t: 12, label: "CTA" },
  ]);
  const [sub, setSub] = useState("");
  const [overlayCTA, setOverlayCTA] = useState("Xem ngay");
  const dims = aspectDims(ratio);

  const addBeat = () => setBeats((b) => [...b, { t: Math.min(duration - 1, (b[b.length - 1]?.t || 0) + 3), label: "Beat" }]);
  const removeBeat = (idx) => setBeats((b) => b.filter((_, i) => i !== idx));

  const autoScript = () => {
    setHook("3 mẹo tiết kiệm 30% khi mua online mà ít ai biết!");
    setSub("[0-3s] Hook mạnh — [4-10s] Mẹo 1-2-3 — [11-15s] CTA kêu gọi hành động");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Controls */}
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["TikTok", "Instagram Reels", "YouTube Shorts", "Facebook Reels"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`px-3 py-2 rounded-xl text-sm border transition ${
                platform === p ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton icon={VideoIcon} label="Clip" />
          <ToolbarButton icon={TypeIcon} label="Sub" />
          <ToolbarButton icon={Palette} label="Branding" />
          <ToolbarButton icon={Layers} label="Lớp" />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Tỉ lệ khung hình">
            <select className="w-full border rounded-xl px-3 py-2" value={ratio} onChange={(e) => setRatio(e.target.value)}>
              {RATIOS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Độ dài (giây)">
            <input type="number" min={5} max={120} className="w-full border rounded-xl px-3 py-2" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </Field>
          <Field label="CTA overlay">
            <input className="w-full border rounded-xl px-3 py-2" value={overlayCTA} onChange={(e) => setOverlayCTA(e.target.value)} />
          </Field>
        </div>

        <Field label="Hook mở đầu" hint="Câu đầu tiên phải mạnh & rõ lợi ích" required>
          <input className="w-full border rounded-xl px-3 py-2" placeholder="Ví dụ: Đừng mua online nếu chưa biết 3 mẹo này!" value={hook} onChange={(e) => setHook(e.target.value)} />
        </Field>

        <Field label="Kịch bản nhanh (timeline)" hint="Mỗi beat 2-5s, kết sớm bằng CTA">
          <div className="space-y-2">
            {beats.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={duration - 1}
                  className="w-20 border rounded-xl px-2 py-2"
                  value={b.t}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setBeats((arr) => arr.map((x, idx) => (idx === i ? { ...x, t: v } : x)));
                  }}
                />
                <input className="flex-1 border rounded-xl px-3 py-2" value={b.label} onChange={(e) => setBeats((arr) => arr.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))} />
                <Button variant="outline" onClick={() => removeBeat(i)}>
                  Xoá
                </Button>
              </div>
            ))}
            <Button onClick={addBeat}>+ Thêm beat</Button>
          </div>
        </Field>

        <Field label="Phụ đề (sub) / Script" hint="Dán văn bản để auto-sub">
          <textarea className="w-full border rounded-2xl px-3 py-2 min-h-[96px]" placeholder="Nội dung thoại hoặc phụ đề..." value={sub} onChange={(e) => setSub(e.target.value)} />
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={autoScript}>
              <Sparkles className="w-4 h-4 mr-1" /> Gợi ý kịch bản (AI)
            </Button>
            <Button variant="outline">
              <Hash className="w-4 h-4 mr-1" /> Gợi ý hashtag
            </Button>
          </div>
        </Field>

        <div className="flex items-center gap-2">
          <Button>Xuất cấu hình JSON</Button>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-1" /> Lên lịch đăng
          </Button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost">
            <Smartphone className="w-4 h-4 mr-1" /> Mobile
          </Button>
          <Button variant="ghost">
            <Tablet className="w-4 h-4 mr-1" /> Tablet
          </Button>
          <Button variant="ghost">
            <Monitor className="w-4 h-4 mr-1" /> Desktop
          </Button>
          <div className="ml-auto text-sm text-gray-500">
            Nền tảng: <span className="font-medium text-gray-700">{platform}</span>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-4">
          <div className="relative mx-auto rounded-2xl overflow-hidden shadow" style={{ width: dims.w, height: dims.h, background: "#0f172a" }}>
            {/* time ruler */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-black/40 text-[10px] text-white flex items-center gap-2 px-2">
              <VideoIcon className="w-3 h-3" /> {duration}s timeline
            </div>

            {/* Hook overlay */}
            <div className="absolute top-6 left-3 right-3">
              <div className="bg-white/95 text-gray-900 rounded-xl px-3 py-2 text-sm font-semibold line-clamp-2">{hook || "Hook mở đầu gây tò mò"}</div>
            </div>

            {/* Beats markers */}
            <div className="absolute bottom-10 left-2 right-2 h-2 bg-white/20 rounded-full overflow-hidden">
              {beats.map((b, i) => (
                <div key={i} className="absolute -top-1 w-1.5 h-4 bg-fuchsia-400 rounded" style={{ left: `${(b.t / duration) * 100}%` }} title={`${b.t}s - ${b.label}`} />
              ))}
            </div>

            {/* CTA pill */}
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center text-[11px] px-2.5 py-1.5 rounded-full bg-purple-600 text-white shadow">{overlayCTA}</span>
            </div>
          </div>

          <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" /> Hook &lt; 3s, thông điệp rõ
            </li>
            <li className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Cỡ chữ phụ đề ≥ 42px (9:16)
            </li>
            <li className="flex items-center gap-2">
              <Hash className="w-4 h-4" /> 3-5 hashtag ngách
            </li>
            <li className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> End screen có CTA
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// --- Dev: lightweight self-tests (no external runner) ---
const DevTestPanel = () => {
  const [results, setResults] = useState([]);
  const run = () => {
    const r = [];
    const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    try {
      r.push({ name: "aspectDims 1:1", pass: eq(aspectDims("1:1"), { w: 320, h: 320 }) });
      r.push({ name: "aspectDims 4:5", pass: eq(aspectDims("4:5"), { w: 320, h: 400 }) });
      r.push({ name: "aspectDims 9:16", pass: eq(aspectDims("9:16"), { w: 300, h: 533 }) });
      r.push({ name: "aspectDims 16:9", pass: eq(aspectDims("16:9"), { w: 480, h: 270 }) });
      r.push({ name: "aspectDims default", pass: eq(aspectDims("weird"), { w: 320, h: 320 }) });
      r.push({ name: "RATIOS are strings with ':'", pass: RATIOS.every((x) => typeof x === "string" && x.includes(":")) });
    } catch (e) {
      r.push({ name: "self-test crashed", pass: false, details: String(e) });
    }
    setResults(r);
  };

  return (
    <div className="mt-8 rounded-2xl border p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800">DEV • Self-tests</h3>
        <Button variant="outline" onClick={run}>Run tests</Button>
      </div>
      <ul className="space-y-1">
        {results.map((t, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            {t.pass ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
            <span className={t.pass ? "text-gray-800" : "text-rose-700"}>{t.name}</span>
            {!t.pass && t.details ? <span className="text-xs text-rose-500">— {t.details}</span> : null}
          </li>
        ))}
        {results.length === 0 ? <li className="text-xs text-gray-500">(Chưa chạy — bấm "Run tests")</li> : null}
      </ul>
    </div>
  );
};

export default function ContentDesignerMockForms() {
  const tabs = [
    { key: "social", label: "Bài đăng Mạng Xã Hội" },
    { key: "video", label: "Video / Reel / Shorts" },
  ];
  const [active, setActive] = useState("social");

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto font-sans">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Mock Form Thiết Kế Nội Dung Chuyên Nghiệp</h1>
        <p className="text-gray-600 mt-1">Hai mẫu form sẵn dùng để tạo nội dung đăng lên các nền tảng số. Bật AI để gợi ý nhanh, có vùng preview trực quan.</p>
      </header>

      {/* Tabs */}
      <div className="mb-5">
        <div className="relative inline-flex bg-white border rounded-2xl p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`relative z-10 px-4 py-2 rounded-xl text-sm font-medium transition ${active === t.key ? "text-white" : "text-gray-700 hover:text-gray-900"}`}
            >
              {t.label}
              {active === t.key && (
                <motion.span layoutId="pill" className="absolute inset-0 rounded-xl bg-gray-900" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} style={{ zIndex: -1 }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Forms */}
      <div className="space-y-6">{active === "social" ? <SocialPostForm /> : <VideoReelForm />}</div>

      {/* Dev self-tests */}
      <DevTestPanel />

      <footer className="mt-8 text-xs text-gray-500">
        Gợi ý: Chuẩn hoá brand kit (màu/chữ), dùng AI để sinh caption/hashtag theo từng nền tảng, luôn kiểm tra vùng an toàn chữ và tương phản.
      </footer>
    </div>
  );
}
