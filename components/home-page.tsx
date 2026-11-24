import Link from "next/link";
import { HeroArt } from "@/components/hero-art";
import { LanguageSwitcher } from "@/components/language-switcher";
import { formatDateRange, paragraphs, safeEmail } from "@/lib/format";
import { dateLocale, type SiteLocale } from "@/lib/i18n/locales";
import { messagesFor, type Messages } from "@/lib/i18n/messages";
import { certifications, skills } from "@/lib/site";
import type { Portfolio, Project } from "@/lib/contentful/types";

function ContactLinks({
  email,
  linkedin,
  github,
  copy,
}: {
  email: string | null;
  linkedin: string;
  github: string;
  copy: Messages;
}) {
  const links = [
    email ? { href: `mailto:${email}`, label: copy.email, download: false } : null,
    linkedin ? { href: linkedin, label: copy.linkedin, download: false } : null,
    github ? { href: github, label: copy.github, download: false } : null,
    { href: "/Alex_Garulli_CV_2026.pdf", label: copy.downloadCv, download: true },
  ].filter((link) => link !== null);

  return (
    <ul className="contact-links">
      {links.map((link) => (
        <li key={link.label}>
          <a href={link.href} download={link.download ? "Alex_Garulli_CV_2026.pdf" : undefined}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function TechnologyList({ technologies }: { technologies: string[] }) {
  if (technologies.length === 0) return null;
  return (
    <ul className="technologies">
      {technologies.map((technology) => (
        <li key={technology}>{technology}</li>
      ))}
    </ul>
  );
}

function ProjectLinks({ project, copy }: { project: Project; copy: Messages }) {
  const links = [
    project.repositoryUrl ? { href: project.repositoryUrl, label: copy.repository } : null,
    project.demoUrl ? { href: project.demoUrl, label: copy.liveDemo } : null,
  ].filter((link) => link !== null);

  if (links.length === 0) return null;

  return (
    <ul className="project-links">
      {links.map((link) => (
        <li key={link.label}>
          <a href={link.href}>{link.label}</a>
        </li>
      ))}
    </ul>
  );
}

function ProjectCard({
  project,
  copy,
  featured = false,
}: {
  project: Project;
  copy: Messages;
  featured?: boolean;
}) {
  return (
    <article className={featured ? "project project-featured" : "project"}>
      {featured ? <p className="eyebrow">{copy.featured}</p> : null}
      <h3>{project.title}</h3>
      {project.description ? <p>{project.description}</p> : null}
      <TechnologyList technologies={project.technologies} />
      <ProjectLinks project={project} copy={copy} />
    </article>
  );
}

export function HomePage({ portfolio, locale }: { portfolio: Portfolio; locale: SiteLocale }) {
  const { profile, experiences, projects } = portfolio;
  const copy = messagesFor(locale);
  const bio = paragraphs(profile.bio);
  const email = safeEmail(profile.email);
  const featured = projects.find((project) => project.title === "InvestLab") ?? projects[0];
  const otherProjects = projects.filter((project) => project !== featured);

  return (
    <>
      <a className="skip" href="#content">
        {copy.skip}
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <a className="wordmark" href="#content">
            {profile.fullName}
          </a>
          <div className="site-header-tools">
            <nav aria-label={copy.sections}>
              <a href="#expertise">{copy.expertise}</a>
              <a href="#projects">{copy.projects}</a>
              <a href="#experience">{copy.experience}</a>
              <a href="#certifications">{copy.certifications}</a>
              <a href="#contact">{copy.contact}</a>
              <Link href="/blog">{copy.blog}</Link>
            </nav>
            <LanguageSwitcher locale={locale} label={copy.languages} />
          </div>
        </div>
      </header>
      <main id="content">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-identity">
            {profile.location ? <p className="eyebrow">{profile.location}</p> : null}
            <h1 id="hero-heading">{profile.fullName}</h1>
            <p className="lead">{profile.role}</p>
          </div>
          <div className="hero-main">
            <div className="bio">
              {bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <ContactLinks email={email} linkedin={profile.linkedin} github={profile.github} copy={copy} />
          </div>
          <HeroArt alt={copy.heroAlt} />
        </section>

        <section id="expertise" aria-labelledby="expertise-heading">
          <div className="section-heading">
            <h2 id="expertise-heading">{copy.expertiseHeading}</h2>
            <p>{copy.expertiseIntro}</p>
          </div>
          <ul className="skills">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>

        <section id="projects" aria-labelledby="projects-heading">
          <div className="section-heading">
            <h2 id="projects-heading">{copy.projectsHeading}</h2>
            <p>{copy.projectsIntro}</p>
          </div>
          <div className="project-grid">
            {featured ? <ProjectCard project={featured} copy={copy} featured /> : null}
            {otherProjects.map((project) => (
              <ProjectCard key={project.title} project={project} copy={copy} />
            ))}
          </div>
        </section>

        <section id="experience" aria-labelledby="experience-heading">
          <div className="section-heading">
            <h2 id="experience-heading">{copy.experienceHeading}</h2>
            <p>{copy.experienceIntro}</p>
          </div>
          <ol className="timeline">
            {experiences.map((experience) => (
              <li key={`${experience.company}-${experience.role}-${experience.startDate}`}>
                <article className="role">
                  <div className="role-meta">
                    <p className="dates">
                      {formatDateRange(experience.startDate, experience.endDate, copy.present, dateLocale(locale))}
                    </p>
                    <p className="company">{experience.company}</p>
                  </div>
                  <div>
                    <h3>{experience.role}</h3>
                    {experience.description ? <p>{experience.description}</p> : null}
                    <TechnologyList technologies={experience.technologies} />
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section id="certifications" aria-labelledby="certifications-heading">
          <div className="section-heading">
            <h2 id="certifications-heading">{copy.certificationsHeading}</h2>
          </div>
          <ul className="certifications">
            {certifications.map((certification) => (
              <li key={certification.name}>
                <p>{certification.name}</p>
                <p className="year">{certification.year}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" className="contact" aria-labelledby="contact-heading">
          <h2 id="contact-heading">{copy.contactHeading}</h2>
          <p>{copy.contactIntro}</p>
          <ContactLinks email={email} linkedin={profile.linkedin} github={profile.github} copy={copy} />
        </section>
      </main>
    </>
  );
}

export function Unavailable({ locale }: { locale: SiteLocale }) {
  const copy = messagesFor(locale);
  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <a className="wordmark" href="#content">
            Alex Garulli
          </a>
          <LanguageSwitcher locale={locale} label={copy.languages} />
        </div>
      </header>
      <main id="content" className="unavailable">
        <p className="eyebrow">Alex Garulli</p>
        <h1>{copy.unavailableTitle}</h1>
        <p>{copy.unavailableBody}</p>
      </main>
    </>
  );
}
