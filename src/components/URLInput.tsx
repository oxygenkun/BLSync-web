import { useState } from "react";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function URLInput({
  value,
  onChange,
  placeholder = "粘贴 Bilibili 视频链接..."
}: URLInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative group">
      <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focused ? "opacity-30" : ""}`} />
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`w-full px-4 py-3.5 bg-white border rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-700 ${
            focused
              ? "border-blue-500 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/10"
              : "border-slate-200 hover:border-slate-300"
          }`}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-150"
            aria-label="清除输入"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
