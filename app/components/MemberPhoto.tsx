"use client";

import { useState } from "react";
import Image from "next/image";
import { CSSProperties } from "react";

interface MemberPhotoProps {
  bioguideId: string;
  name: string;
  size: number;
  className?: string;
  fallbackClassName?: string;
  fallbackStyle?: CSSProperties;
}

export function MemberPhoto({
  bioguideId,
  name,
  size,
  className = "",
  fallbackClassName = "",
  fallbackStyle,
}: MemberPhotoProps) {
  const [imgError, setImgError] = useState(false);
  const src = `https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress/225x275/${bioguideId}.jpg`;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  if (imgError) {
    return (
      <div className={fallbackClassName} style={fallbackStyle}>
        {initials}
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative" }}>
      <Image
        src={src}
        alt={name}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  );
}
