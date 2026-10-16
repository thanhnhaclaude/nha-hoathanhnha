import { Phone } from "lucide-react";
import { site } from "@/lib/site";
import { ZaloIcon } from "./icons";

export function FloatingContact() {
  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-3 sm:bottom-6 sm:right-6">
      <a href={site.zalo} target="_blank" rel="noopener noreferrer" aria-label="Chat Zalo với shop" className="size-12 overflow-hidden rounded-2xl shadow-lg transition-transform hover:scale-105">
        <ZaloIcon className="size-12" />
      </a>
      <a
        href={`tel:${site.phone}`}
        aria-label={`Gọi ${site.phoneDisplay}`}
        className="relative grid size-12 place-items-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/40 motion-reduce:hidden" aria-hidden />
        <Phone className="relative size-5" aria-hidden />
      </a>
    </div>
  );
}
