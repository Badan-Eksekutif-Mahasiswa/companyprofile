"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import { SITE, YOUTUBE_VIDEO_ID } from "@/config/site";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

const THUMBNAIL_QUALITIES = ["maxresdefault", "sddefault", "hqdefault"] as const;

/**
 * Video profile (PRD 3.1, nice to have). Pola "lite embed":
 * iframe YouTube baru dimuat setelah tombol putar diklik, jadi tidak membebani LCP.
 */
export function VideoSection() {
  const [play, setPlay] = useState(false);
  const [thumbnailQuality, setThumbnailQuality] = useState(0);
  const id = YOUTUBE_VIDEO_ID;
  const fallbackThumbnail = () => setThumbnailQuality((current) => Math.min(current + 1, THUMBNAIL_QUALITIES.length - 1));

  return (
    <section aria-labelledby="video-title" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-wrap px-5">
        <SectionHeading id="video-title" eyebrow="Video Profile" title="Kenali BEM UI" />

        <div className="relative mx-auto mt-10 aspect-video max-w-4xl overflow-hidden rounded-2xl bg-navy/5 shadow-xl">
          {id && play ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
              title="Video profile BEM UI 2026"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : id ? (
            <button
              type="button"
              onClick={() => setPlay(true)}
              data-hover
              className="group absolute inset-0 flex items-center justify-center"
              aria-label="Putar video profile BEM UI"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${id}/${THUMBNAIL_QUALITIES[thumbnailQuality]}.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
                onError={fallbackThumbnail}
                onLoad={(event) => {
                  // YouTube may return a small placeholder instead of an HTTP error.
                  if (event.currentTarget.naturalWidth <= 120) fallbackThumbnail();
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="relative flex size-20 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform duration-base ease-out-expo group-hover:scale-110">
                <Play aria-hidden className="ml-1 size-8 fill-current" />
              </span>
            </button>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-secondary">Video profile segera hadir.</p>
              <a
                href={SITE.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "primary" }))}
              >
                Kunjungi YouTube BEM UI
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
