import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const InvoiceGridLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8', icon: 32 },
    md: { box: 'w-11 h-11', icon: 44 },
    lg: { box: 'w-14 h-14', icon: 56 },
    xl: { box: 'w-20 h-20', icon: 80 },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Visual Logo Mark Icon */}
      <div
        className={`relative ${currentSize.box} rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border border-emerald-500/40 p-1.5 flex items-center justify-center shadow-lg shadow-emerald-950/60 group hover:border-emerald-400 transition-all duration-300`}
      >
        {/* Glow ambient background */}
        <div className="absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm group-hover:bg-emerald-500/20 transition-all duration-300" />

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="invDocGrad" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" />
              <stop offset="0.5" stopColor="#06b6d4" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>

            <linearGradient id="gridLineGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6ee7b7" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>

            <linearGradient id="cornerFold" x1="60" y1="15" x2="85" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Document Base (Invoice Sheet) */}
          <path
            d="M22 18C22 14.6863 24.6863 12 28 12H62L78 28V82C78 85.3137 75.3137 88 72 88H28C24.6863 88 22 85.3137 22 82V18Z"
            fill="#090d16"
            stroke="url(#invDocGrad)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Document Folded Corner */}
          <path
            d="M62 12V25C62 26.6569 63.3431 28 65 28H78L62 12Z"
            fill="url(#cornerFold)"
            stroke="#10b981"
            strokeWidth="1.5"
          />

          {/* Excel Spreadsheet Grid Matrix inside the Invoice */}
          {/* Top Header Row of the Grid */}
          <rect
            x="31"
            y="36"
            width="38"
            height="9"
            rx="2"
            fill="#10b981"
            fillOpacity="0.25"
            stroke="#34d399"
            strokeWidth="1.2"
          />

          {/* Grid Rows & Columns */}
          {/* Vertical Divider 1 */}
          <line x1="43" y1="36" x2="43" y2="76" stroke="url(#gridLineGrad)" strokeWidth="1.2" strokeOpacity="0.7" />
          {/* Vertical Divider 2 */}
          <line x1="56" y1="36" x2="56" y2="76" stroke="url(#gridLineGrad)" strokeWidth="1.2" strokeOpacity="0.7" />

          {/* Horizontal Row 1 */}
          <line x1="31" y1="46" x2="69" y2="46" stroke="url(#gridLineGrad)" strokeWidth="1.2" strokeOpacity="0.7" />
          {/* Horizontal Row 2 */}
          <line x1="31" y1="56" x2="69" y2="56" stroke="url(#gridLineGrad)" strokeWidth="1.2" strokeOpacity="0.7" />
          {/* Horizontal Row 3 */}
          <line x1="31" y1="66" x2="69" y2="66" stroke="url(#gridLineGrad)" strokeWidth="1.2" strokeOpacity="0.7" />

          {/* Outer Grid Frame */}
          <rect
            x="31"
            y="36"
            width="38"
            height="40"
            rx="2.5"
            fill="none"
            stroke="url(#gridLineGrad)"
            strokeWidth="1.5"
          />

          {/* Active Highlighted Cell (Accounting Precision Check) */}
          <rect
            x="57"
            y="57"
            width="11"
            height="8"
            rx="1"
            fill="#10b981"
            filter="url(#glowFilter)"
          />

          {/* Sparkling AI Star on the top-left */}
          <path
            d="M20 30L22 23L29 21L22 19L20 12L18 19L11 21L18 23L20 30Z"
            fill="#38bdf8"
            filter="url(#glowFilter)"
          />
        </svg>
      </div>

      {/* Brand Typography (Optional when showText is true) */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tight text-ink font-['Inter',sans-serif]">
              Invoice<span className="text-emerald-700">Grid</span>
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/20 font-['Cairo',sans-serif]">
              إنفويس جريد
            </span>
          </div>
          <span className="text-[10px] text-muted font-medium font-['Cairo',sans-serif]">
            تحويل الفواتير والـ PDF إلى جداول إكسيل بالذكاء الاصطناعي
          </span>
        </div>
      )}
    </div>
  );
};
