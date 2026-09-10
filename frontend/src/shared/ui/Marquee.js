import { cn } from "../utils/cn";

export function Marquee({
    className = "",
    reverse = false,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 4,
    ...props
}) {
    return (
        <div
            className={cn(
                "group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
                vertical ? "flex-col" : "flex-row",
                className
            )}
            {...props}
        >
            {Array(repeat)
                .fill(0)
                .map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex shrink-0 justify-around gap-(--gap)",
                            vertical
                                ? "animate-marquee-vertical flex-col"
                                : "animate-marquee flex-row",
                            pauseOnHover && "group-hover:[animation-play-state:paused]",
                            reverse && "[animation-direction:reverse]"
                        )}
                    >
                        {children}
                    </div>
                ))}
        </div>
    );
}
