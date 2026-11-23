import { getImageProps } from "next/image";

const defaultAlt =
  "Illustration of Beta and Kamome with cherry blossoms, a torii, Mount Fuji and Tokyo Tower.";

export function HeroArt({ alt = defaultAlt }: { alt?: string }) {
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
  const {
    props: { srcSet: narrow },
  } = getImageProps({
    alt,
    src: "/brand/header-narrow.jpg",
    width: 1024,
    height: 341,
    sizes: "calc(100vw - 2.5rem)",
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
        <source media="(max-width: 767px)" srcSet={narrow} />
        <img {...mobile} alt={alt} />
      </picture>
    </figure>
  );
}
