"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/jour", label: "Jour" },
  { href: "/planning", label: "Planning" },
  { href: "/vie", label: "Vie" },
  { href: "/echecs", label: "Échecs" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:static lg:border-t-0 lg:border-r lg:bg-transparent">
      <ul className="mx-auto grid max-w-lg grid-cols-4 lg:flex lg:h-full lg:max-w-none lg:flex-col lg:gap-1 lg:p-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-14 items-center justify-center text-[13px] lg:justify-start lg:rounded-md lg:px-3 ${
                  active ? "font-semibold text-paper" : "text-faint"
                }`}
              >
                <span
                  className={`absolute top-0 h-0.5 w-7 bg-brass lg:top-1/2 lg:left-0 lg:h-4 lg:w-0.5 lg:-translate-y-1/2 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
