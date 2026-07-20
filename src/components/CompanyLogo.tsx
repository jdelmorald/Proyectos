import Image from "next/image";

const INITIAL_BADGE_COLORS = [
  "bg-[#1F2E4D] text-[#EDE6D6]",
  "bg-[#5C4033] text-[#EDE6D6]",
  "bg-[#2F5D50] text-[#EDE6D6]",
  "bg-[#6B3F52] text-[#EDE6D6]",
  "bg-[#42506B] text-[#EDE6D6]",
];

function colorForName(name: string) {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return INITIAL_BADGE_COLORS[sum % INITIAL_BADGE_COLORS.length];
}

export function CompanyLogo({
  name,
  logoPath,
  size = 28,
}: {
  name: string;
  logoPath?: string | null;
  size?: number;
}) {
  if (logoPath) {
    return (
      <span
        className="inline-flex items-center justify-center bg-white rounded-md border border-[var(--line)] overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={logoPath}
          alt={name}
          width={size}
          height={size}
          className="object-contain w-full h-full p-0.5"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-serif text-xs font-semibold shrink-0 ${colorForName(name)}`}
      style={{ width: size, height: size }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
