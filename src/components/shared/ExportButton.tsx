"use client";

import { DownloadIcon } from "./Icons";

interface ExportButtonProps {
  label: string;
  data: Record<string, unknown>[];
  filename: string;
  disabled?: boolean;
}

function toCsvRow(row: Record<string, unknown>): string {
  return Object.values(row)
    .map((v) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map(toCsvRow)].join("\n");
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportToolbar({
  label,
  data,
  csvFilename,
}: {
  label: string;
  data: Record<string, unknown>[];
  csvFilename: string;
}) {
  const disabled = data.length === 0;

  return (
    <div className="hk-list__toolbar">
      <div className="hk-list__toolbar-label">{label}</div>
      <div className="hk-list__actions">
        <button
          className="hk-chipbtn"
          disabled={disabled}
          onClick={() => downloadCsv(data, csvFilename)}
          title={disabled ? "אין נתונים לייצוא" : undefined}
        >
          <DownloadIcon /> CSV
        </button>
      </div>
    </div>
  );
}
