interface LiveIndicatorProps {
  className?: string;
}

export default function LiveIndicator({ className = "" }: LiveIndicatorProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 bg-neon-green/15 text-neon-green text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}>
      <span className="h-2 w-2 rounded-full bg-neon-green animate-blink-live" />
      LIVE
    </span>
  );
}
