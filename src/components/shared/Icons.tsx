interface IconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function LogoutIcon({ width = 18, height = 18, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 12H3m0 0l3-3m-3 3l3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClockIcon({ width = 14, height = 14, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WalletIcon({ width = 14, height = 14, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 13h2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function DownloadIcon({ width = 13, height = 13, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 3v12m0 0l-4-4m4 4l4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ReceiptIcon({ width = 14, height = 14, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArrowOutIcon({ width = 14, height = 14, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M14 4h6v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 4l-9 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlusIcon({ width = 18, height = 18, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EditIcon({ width = 18, height = 18, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 20h4l10-10-4-4L4 16v4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function WarnIcon({ width = 18, height = 18, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 3l10 18H2L12 3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 10v5M12 18v.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RefreshIcon({ width = 14, height = 14, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M3 12a9 9 0 0 1 15.5-6.3M21 12a9 9 0 0 1-15.5 6.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19 3v4h-4M5 21v-4h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EmptyIcon({ width = 34, height = 34, ...p }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...p}>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M7 10h6M7 14h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WhatsAppIcon({ width = 28, height = 28 }: IconProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.4L3 29l6.8-1.7c1.8 1 3.9 1.5 6.1 1.5h.1C23.2 28.8 29 23 29 15.8 29 8.8 23.2 3 16 3zm7.6 18.4c-.3.9-1.9 1.8-2.6 1.9-.7.1-1.5.1-2.4-.2-.6-.2-1.3-.4-2.2-.8-3.9-1.7-6.4-5.6-6.6-5.9-.2-.3-1.6-2.1-1.6-4 0-1.9 1-2.8 1.4-3.2.4-.4.8-.5 1.1-.5h.8c.3 0 .6 0 .9.7.3.8 1.1 2.7 1.2 2.9.1.2.2.4 0 .7-.1.3-.2.4-.4.7-.2.2-.4.5-.6.7-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.4 1.3 2.7 1.7 3.1 1.9.4.2.6.2.8-.1.2-.3.9-1.1 1.2-1.4.3-.4.5-.3.9-.2.3.1 2.2 1 2.6 1.2.4.2.6.3.7.5.1.2.1 1-.2 1.8z" />
    </svg>
  );
}
