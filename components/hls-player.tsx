type HlsPlayerProps = {
  hlsUrl: string;
  className?: string;
};

export function HlsPlayer({ hlsUrl, className }: HlsPlayerProps) {
  const url = new URL(hlsUrl);
  url.searchParams.set("autoplay", "true");
  url.searchParams.set("muted", "true");
  url.searchParams.set("playsInline", "true");

  return (
    <iframe
      src={url.toString()}
      title="Live CCTV"
      allow="autoplay; fullscreen; picture-in-picture"
      className={`border-0 ${className ?? ""}`}
    />
  );
}
