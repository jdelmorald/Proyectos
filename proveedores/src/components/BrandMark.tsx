export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const markSize =
    size === "sm" ? "h-[54px] w-[54px] rounded-[14px] p-[7px]" : "h-24 w-24 rounded-[24px] p-3";
  const wordSize = size === "sm" ? "text-[.86rem]" : "text-[1.28rem]";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${markSize} bg-white shadow-lg flex items-center justify-center shrink-0`}
        style={{ boxShadow: "0 16px 32px -10px rgba(43,35,32,0.42)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Sumivensa" className="h-full w-full object-contain" />
      </div>
      <div className="leading-none">
        <div
          className={`font-display font-extrabold ${wordSize}`}
          style={{ color: "var(--color-ink)", letterSpacing: "-.005em" }}
        >
          SUMIVENSA
        </div>
        <div
          className="text-[.58rem] font-semibold uppercase mt-1"
          style={{ color: "var(--color-accent)", letterSpacing: ".14em" }}
        >
          Sistema de Proveedores
        </div>
      </div>
    </div>
  );
}
