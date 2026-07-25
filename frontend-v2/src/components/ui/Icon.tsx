export type IconName =
  | "grid"
  | "radar"
  | "flask"
  | "layers"
  | "link"
  | "archive"
  | "chart"
  | "power"
  | "settings"
  | "users"
  | "menu"
  | "chevronLeft"
  | "chevronRight"
  | "x"
  | "bell"
  | "sparkles"
  | "pen"
  | "shield"
  | "check"
  | "globe"
  | "clock"
  | "search"
  | "vaultDoor"
  | "mic"
  | "clapper";

const PATHS: Record<IconName, string> = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  radar:
    "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0 M12 12l6-4",
  flask: "M9 3h6 M10 3v6l-5.5 9a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3 M7 15h10",
  layers: "M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5 M3 18l9 5 9-5",
  link: "M9 15l6-6 M8 12l-2.5 2.5a3 3 0 0 0 4 4.5L12 16 M12 8l2.5-2.5a3 3 0 0 1 4 4.5L16 12",
  archive: "M3 6h18v3H3z M5 9v11h14V9 M10 13h4",
  chart: "M4 20V10 M11 20V4 M18 20v-7",
  power: "M12 3v9 M6 6.3a8 8 0 1 0 12 0",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 12.9c.04-.3.06-.6.06-.9s-.02-.6-.06-.9l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.6-.9L15 3h-4l-.4 2.6a7.4 7.4 0 0 0-1.6.9l-2.4-1-2 3.4 2 1.6a7.3 7.3 0 0 0 0 1.8l-2 1.6 2 3.4 2.4-1c.5.4 1 .7 1.6.9L11 21h4l.4-2.6a7.4 7.4 0 0 0 1.6-.9l2.4 1 2-3.4-2-1.6z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  chevronLeft: "M15 18l-6-6 6-6",
  chevronRight: "M9 18l6-6-6-6",
  x: "M18 6L6 18 M6 6l12 12",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0",
  sparkles:
    "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z",
  pen: "M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z",
  shield: "M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z",
  check: "M5 13l4 4L19 7",
  globe:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3.5 2",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3",
  vaultDoor:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 3v18 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 10.5v3",
  mic: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10a7 7 0 0 1-14 0 M12 19v3 M8 22h8",
  clapper:
    "M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z M4 9l1.5-4h3l-1.5 4 M9.5 9l1.5-4h3l-1.5 4 M15 9l1.5-4h3l-1.5 4",
};

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className, size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
