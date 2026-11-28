import Link from "next/link";
import { Furigana } from "@/components/furigana";
import { HeroArt } from "@/components/hero-art";
import { LanguageSwitcher } from "@/components/language-switcher";
import { formatDateRange, paragraphs, safeEmail } from "@/lib/format";
import { annotateJapaneseDate, rubyPlain } from "@/lib/i18n/furigana";
import { dateLocale, type SiteLocale } from "@/lib/i18n/locales";
import { japaneseDisclaimer, messagesFor, type Messages } from "@/lib/i18n/messages";
import { certifications, skills } from "@/lib/site";
import type { Portfolio, Project } from "@/lib/contentful/types";

function LocaleText({ locale, text }: { locale: SiteLocale; text: string }) {
  if (locale !== "ja") return text;
  return <Furigana text={text} />;
}

function ContactLinks({
  email,
  linkedin,
  github,
  copy,
  locale,
}: {
  email: string | null;
  linkedin: string;
  github: string;
  copy: Messages;
  locale: SiteLocale;
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
        <li key={rubyPlain(link.label)}>
          <a href={link.href} download={link.download ? "Alex_Garulli_CV_2026.pdf" : undefined}>
            <LocaleText locale={locale} text={link.label} />
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

function ProjectLinks({ project, copy, locale }: { project: Project; copy: Messages; locale: SiteLocale }) {
  const links = [
    project.repositoryUrl ? { href: project.repositoryUrl, label: copy.repository } : null,
    project.demoUrl ? { href: project.demoUrl, label: copy.liveDemo } : null,
  ].filter((link) => link !== null);

  if (links.length === 0) return null;

  return (
    <ul className="project-links">
      {links.map((link) => (
        <li key={rubyPlain(link.label)}>
          <a href={link.href}>
            <LocaleText locale={locale} text={link.label} />
          </a>
        </li>
      ))}
    </ul>
  );
}

function ProjectCard({
  project,
  copy,
  locale,
  featured = false,
}: {
  project: Project;
  copy: Messages;
  locale: SiteLocale;
  featured?: boolean;
}) {
  return (
    <article className={featured ? "project project-featured" : "project"}>
      {featured ? (
        <p className="eyebrow">
          <LocaleText locale={locale} text={copy.featured} />
        </p>
      ) : null}
      <h3>{project.title}</h3>
      {project.description ? (
        <p>
          <LocaleText locale={locale} text={project.description} />
        </p>
      ) : null}
      <TechnologyList technologies={project.technologies} />
      <ProjectLinks project={project} copy={copy} locale={locale} />
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
        <LocaleText locale={locale} text={copy.skip} />
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <a className="wordmark" href="#content">
            {profile.fullName}
          </a>
          <div className="site-header-tools">
            <nav aria-label={rubyPlain(copy.sections)}>
              <a href="#expertise">
                <LocaleText locale={locale} text={copy.expertise} />
              </a>
              <a href="#projects">
                <LocaleText locale={locale} text={copy.projects} />
              </a>
              <a href="#experience">
                <LocaleText locale={locale} text={copy.experience} />
              </a>
              <a href="#certifications">
                <LocaleText locale={locale} text={copy.certifications} />
              </a>
              <a href="#contact">
                <LocaleText locale={locale} text={copy.contact} />
              </a>
              <Link href="/services">
                <LocaleText locale={locale} text={copy.services} />
              </Link>
              <Link href="/blog">
                <LocaleText locale={locale} text={copy.blog} />
              </Link>
            </nav>
            <LanguageSwitcher locale={locale} label={rubyPlain(copy.languages)} />
          </div>
        </div>
      </header>
      <main id="content">
        {locale === "ja" ? (
          <aside className="ja-note">
            <p>
              <Furigana text={japaneseDisclaimer.ja} />
            </p>
            <p className="ja-note-en" lang="en">
              {japaneseDisclaimer.en}
            </p>
          </aside>
        ) : null}
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-identity">
            {profile.location ? <p className="eyebrow">{profile.location}</p> : null}
            <h1 id="hero-heading">{profile.fullName}</h1>
            <p className="lead">
              <LocaleText locale={locale} text={profile.role} />
            </p>
          </div>
          <div className="hero-main">
            <div className="bio">
              {bio.map((paragraph) => (
                <p key={rubyPlain(paragraph)}>
                  <LocaleText locale={locale} text={paragraph} />
                </p>
              ))}
            </div>
            <ContactLinks email={email} linkedin={profile.linkedin} github={profile.github} copy={copy} locale={locale} />
          </div>
          <HeroArt alt={rubyPlain(copy.heroAlt)} />
        </section>

        <section id="expertise" aria-labelledby="expertise-heading">
          <div className="section-heading">
            <h2 id="expertise-heading">
              <LocaleText locale={locale} text={copy.expertiseHeading} />
            </h2>
            <p>
              <LocaleText locale={locale} text={copy.expertiseIntro} />
            </p>
          </div>
          <ul className="skills">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>

        <section id="projects" aria-labelledby="projects-heading">
          <div className="section-heading">
            <h2 id="projects-heading">
              <LocaleText locale={locale} text={copy.projectsHeading} />
            </h2>
            <p>
              <LocaleText locale={locale} text={copy.projectsIntro} />
            </p>
          </div>
          <div className="project-grid">
            {featured ? <ProjectCard project={featured} copy={copy} locale={locale} featured /> : null}
            {otherProjects.map((project) => (
              <ProjectCard key={project.title} project={project} copy={copy} locale={locale} />
            ))}
          </div>
        </section>

        <section id="experience" aria-labelledby="experience-heading">
          <div className="section-heading">
            <h2 id="experience-heading">
              <LocaleText locale={locale} text={copy.experienceHeading} />
            </h2>
            <p>
              <LocaleText locale={locale} text={copy.experienceIntro} />
            </p>
          </div>
          <ol className="timeline">
            {experiences.map((experience) => (
              <li key={`${experience.company}-${experience.role}-${experience.startDate}`}>
                <article className="role">
                  <div className="role-meta">
                    <p className="dates">
                      <LocaleText
                        locale={locale}
                        text={
                          locale === "ja"
                            ? annotateJapaneseDate(
                                formatDateRange(
                                  experience.startDate,
                                  experience.endDate,
                                  rubyPlain(copy.present),
                                  dateLocale(locale),
                                ),
                              )
                            : formatDateRange(experience.startDate, experience.endDate, copy.present, dateLocale(locale))
                        }
                      />
                    </p>
                    <p className="company">{experience.company}</p>
                  </div>
                  <div>
                    <h3>
                      <LocaleText locale={locale} text={experience.role} />
                    </h3>
                    {experience.description ? (
                      <p>
                        <LocaleText locale={locale} text={experience.description} />
                      </p>
                    ) : null}
                    <TechnologyList technologies={experience.technologies} />
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section id="certifications" aria-labelledby="certifications-heading">
          <div className="section-heading">
            <h2 id="certifications-heading">
            <LocaleText locale={locale} text={copy.certificationsHeading} />
          </h2>
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
          <h2 id="contact-heading">
            <LocaleText locale={locale} text={copy.contactHeading} />
          </h2>
          <p>
            <LocaleText locale={locale} text={copy.contactIntro} />
          </p>
          <ContactLinks email={email} linkedin={profile.linkedin} github={profile.github} copy={copy} locale={locale} />
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
          <LanguageSwitcher locale={locale} label={rubyPlain(copy.languages)} />
        </div>
      </header>
      <main id="content" className="unavailable">
        <p className="eyebrow">Alex Garulli</p>
        <h1>
          <LocaleText locale={locale} text={copy.unavailableTitle} />
        </h1>
        <p>
          <LocaleText locale={locale} text={copy.unavailableBody} />
        </p>
      </main>
    </>
  );
}
