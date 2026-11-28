import Link from "next/link";
import { ServiceIcon } from "@/components/service-icons";
import type { Service, ServicePageContent } from "@/lib/contentful/services";
import { paragraphs } from "@/lib/format";

function ServiceCard({ service }: { service: Service }) {
  const description = paragraphs(service.description);
  return (
    <article className="service-card">
      <ServiceIcon slug={service.slug} />
      <h2>{service.title}</h2>
      {service.tagline ? <p className="lead">{service.tagline}</p> : null}
      {description.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {service.features.length > 0 ? (
        <ul className="service-features">
          {service.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function ServicesUnavailable() {
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="wordmark" href="/">
            Alex Garulli
          </Link>
          <nav aria-label="Site">
            <Link href="/">Portfolio</Link>
            <Link href="/services" aria-current="page">
              Services
            </Link>
            <Link href="/blog">Blog</Link>
          </nav>
        </div>
      </header>
      <main id="content" className="services-main">
        <p className="eyebrow">Services</p>
        <h1>Services are temporarily unavailable</h1>
        <p>The published services could not be loaded. Please try again shortly.</p>
        <p>
          <Link href="/">Back to the portfolio</Link>
        </p>
      </main>
    </>
  );
}

export function ServicesPage({ content }: { content: ServicePageContent }) {
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="wordmark" href="/">
            {content.fullName}
          </Link>
          <nav aria-label="Site">
            <Link href="/">Portfolio</Link>
            <Link href="/services" aria-current="page">
              Services
            </Link>
            <Link href="/blog">Blog</Link>
          </nav>
        </div>
      </header>
      <main id="content" className="services-main">
        <p className="eyebrow">Services</p>
        <h1>Website development and frontend modernisation</h1>
        <p className="lead">Experienced, cost-effective engineering for small businesses and digital agencies.</p>
        <div className="service-grid">
          {content.services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
        <section className="contact" aria-labelledby="services-contact-heading">
          <h2 id="services-contact-heading">Start a conversation</h2>
          <p>Email me about a new website, modernising an existing frontend, or ongoing support.</p>
          {content.email ? (
            <p>
              <a href={`mailto:${content.email}`}>{content.email}</a>
            </p>
          ) : null}
        </section>
      </main>
    </>
  );
}
