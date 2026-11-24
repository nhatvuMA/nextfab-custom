"use client";
export default function PrintButton() {
  return <button onClick={() => window.print()} className="nf-btn text-sm print:hidden">Print / Save PDF</button>;
}
