import { getImageProps } from "next/image";

const alt =
  "Illustration of Beta and Kamome with cherry blossoms, a torii, Mount Fuji and Tokyo Tower.";

export function HeroArt() {
  const sizes = "(min-width: 1024px) 380px, (min-width: 768px) 184px, 160px";
  const {
    props: { srcSet: desktop },
  } = getImageProps({
    alt,
    src: "/brand/header-desktop.webp",
    width: 1024,
    height: 512,
    sizes,
    quality: 75,
  });
  const { props: mobile } = getImageProps({
    alt,
    src: "/brand/header-mobile.webp",
    width: 1024,
    height: 1024,
    sizes,
    quality: 75,
  });

  return (
    <figure className="hero-art">
      <picture>
        <source media="(min-width: 1024px)" srcSet={desktop} />
        <img {...mobile} />
      </picture>
    </figure>
  );
}
