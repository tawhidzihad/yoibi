import { useState, useRef } from "react";

interface DragState {
  isDown: boolean;
  startX: number;
  scrollLeft: number;
  dragged: boolean;
}

interface ImageCarouselProps {
  images: string[];
  onImageClick: (index: number) => void;
}

export function ImageCarousel({ images, onImageClick }: ImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const dragState = useRef<DragState>({ isDown: false, startX: 0, scrollLeft: 0, dragged: false });

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveIndex(index);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, dragged: false };
    el.style.cursor = "grabbing";
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState.current.isDown) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - dragState.current.startX;
    if (Math.abs(walk) > 5) dragState.current.dragged = true;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  };
  const onMouseUp = () => {
    if (!dragState.current.isDown) return;
    dragState.current.isDown = false;
    const el = scrollRef.current;
    if (!el) return;
    el.style.cursor = "grab";
    el.style.scrollBehavior = "smooth";
    el.style.scrollSnapType = "x mandatory";
    const cardWidth = (el.firstElementChild as HTMLElement)?.offsetWidth || el.offsetWidth;
    const gap = 12;
    const target = Math.round(el.scrollLeft / (cardWidth + gap));
    el.scrollTo({ left: target * (cardWidth + gap) });
    requestAnimationFrame(() => {
      el.style.scrollBehavior = "";
    });
  };

  if (images.length === 1) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl">
        <img
          src={images[0]}
          alt=""
          onClick={() => onImageClick(0)}
          className="aspect-[3/2] w-full cursor-pointer object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative mt-3">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none cursor-grab select-none"
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            draggable={false}
            onClick={() => { if (!dragState.current.dragged) onImageClick(i); }}
            className="aspect-[3/2] w-[85%] shrink-0 snap-center cursor-pointer rounded-xl object-cover"
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex justify-center gap-1">
          {images.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === activeIndex ? "w-4 bg-cyan-400" : "w-1 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
