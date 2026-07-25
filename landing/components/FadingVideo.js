// Background video with a hand-rolled requestAnimationFrame crossfade —
// no CSS transitions. Fades in on load, fades out 0.55s before the clip
// ends, then loops manually via the `ended` event (loop attribute is off
// on purpose so we control the fade-out timing ourselves).
const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55;

function FadingVideo({ src, className = "" }) {
  const videoRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const fadingOutRef = React.useRef(false);

  const fadeTo = (target, duration) => {
    const video = videoRef.current;
    if (!video) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = parseFloat(video.style.opacity || "0");
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      video.style.opacity = start + (target - start) * t;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const onLoadedData = () => {
      video.style.opacity = 0;
      video.play().catch(() => {});
      fadeTo(1, FADE_MS);
    };

    const onTimeUpdate = () => {
      if (!video.duration) return;
      const remaining = video.duration - video.currentTime;
      if (!fadingOutRef.current && remaining <= FADE_OUT_LEAD && remaining > 0) {
        fadingOutRef.current = true;
        fadeTo(0, FADE_MS);
      }
    };

    const onEnded = () => {
      video.style.opacity = 0;
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
        fadingOutRef.current = false;
        fadeTo(1, FADE_MS);
      }, 100);
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [src]);

  if (!src) return null;

  return (
    <video
      ref={videoRef}
      className={className}
      style={{ opacity: 0 }}
      src={src}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  );
}

window.FadingVideo = FadingVideo;
