"use client";

const rows = [
  {
    images: [
      "/images/scroll/car-1.jpg",
      "/images/scroll/car-2.jpg",
      "/images/scroll/car-3.jpg",
      "/images/scroll/car-4.jpg",
      "/images/scroll/car-5.jpg",
      "/images/scroll/car-6.jpg",
    ],
  },
  {
    images: [
      "/images/scroll/furniture-1.jpg",
      "/images/scroll/furniture-2.jpg",
      "/images/scroll/furniture-3.jpg",
      "/images/scroll/furniture-4.jpg",
      "/images/scroll/furniture-5.jpg",
      "/images/scroll/furniture-6.jpg",
    ],
  },
  {
    images: [
      "/images/scroll/appliance-1.jpg",
      "/images/scroll/appliance-2.jpg",
      "/images/scroll/appliance-3.jpg",
      "/images/scroll/appliance-4.jpg",
      "/images/scroll/appliance-5.jpg",
      "/images/scroll/appliance-6.jpg",
    ],
  },
];

function ScrollRow({
  images,
  duration = 30,
}: {
  images: string[];
  duration?: number;
}) {
  const doubled = [...images, ...images];

  return (
    <div className="relative overflow-hidden">
      <div
        className="scroll-row-left flex w-max gap-3"
        style={{
          animationDuration: `${duration}s`,
          WebkitAnimationDuration: `${duration}s`,
        }}
      >
        {doubled.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="h-24 w-36 flex-shrink-0 rounded-lg object-cover sm:h-28 sm:w-44"
          />
        ))}
      </div>
    </div>
  );
}

export function ScrollingImages() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-3 overflow-hidden"
    >
      {rows.map((row, i) => (
        <ScrollRow
          key={i}
          images={row.images}
          duration={20 + i * 5}
        />
      ))}
    </div>
  );
}
