import { useState } from "react";
import { Link2, X } from "lucide-react";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function URLInput({
  value,
  onChange,
  placeholder = "粘贴 Bilibili 视频链接，例如 https://b23.tv/… 或 BV 号"
}: URLInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 bg-surface border rounded-2xl transition-all duration-200 ${
        focused
          ? "border-accent ring-4 ring-accent/15"
          : "border-stone-200/80 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
      }`}
      style={{ boxShadow: "0 1px 2px rgb(28 25 23 / 0.04)" }}
    >
      <Link2
        className={`w-4.5 h-4.5 shrink-0 transition-colors duration-200 ${
          focused ? "text-accent-deep" : "text-stone-400 dark:text-stone-500"
        }`}
        strokeWidth={1.8}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500 text-ink text-[15px]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="p-1 rounded-full text-stone-400 hover:text-ink hover:bg-stone-100 dark:hover:bg-white/10 transition-all duration-150 shrink-0"
          aria-label="清除输入"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
