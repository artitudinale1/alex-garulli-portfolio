import { formatDateRange, paragraphs, safeEmail } from "@/lib/format";
import { certifications, skills } from "@/lib/site";
import type { Portfolio, Project } from "@/lib/contentful/types";

function ContactLinks({
  email,
  linkedin,
  github,
}: {
  email: string | null;
  linkedin: string;
  github: string;
}) {
  const links = [
    email ? { href: `mailto:${email}`, label: "Email" } : null,
    linkedin ? { href: linkedin, label: "LinkedIn" } : null,
    github ? { href: github, label: "GitHub" } : null,
  ].filter((link) => link !== null);

  if (links.length === 0) return null;

  return (
    <ul className="contact-links">
      {links.map((link) => (
        <li key={link.label}>
          <a href={link.href}>{link.label}</a>
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

function ProjectLinks({ project }: { project: Project }) {
  const links = [
    project.repositoryUrl ? { href: project.repositoryUrl, label: "Repository" } : null,
    project.demoUrl ? { href: project.demoUrl, label: "Live demo" } : null,
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

function ProjectCard({ project, featured = false }: { project: Project; featured?: boolean }) {
  return (
    <article className={featured ? "project project-featured" : "project"}>
      {featured ? <p className="eyebrow">Featured project</p> : null}
      <h3>{project.title}</h3>
      {project.description ? <p>{project.description}</p> : null}
      <TechnologyList technologies={project.technologies} />
      <ProjectLinks project={project} />
    </article>
  );
}

export function HomePage({ portfolio }: { portfolio: Portfolio }) {
  const { profile, experiences, projects } = portfolio;
  const bio = paragraphs(profile.bio);
  const email = safeEmail(profile.email);
  const featured = projects.find((project) => project.title === "InvestLab") ?? projects[0];
  const otherProjects = projects.filter((project) => project !== featured);

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <a className="wordmark" href="#content">
            {profile.fullName}
          </a>
          <nav aria-label="Page sections">
            <a href="#expertise">Expertise</a>
            <a href="#projects">Projects</a>
            <a href="#experience">Experience</a>
            <a href="#certifications">Certifications</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>
      <main id="content">
        <section className="hero" aria-labelledby="hero-heading">
          <div>
            {profile.location ? <p className="eyebrow">{profile.location}</p> : null}
            <h1 id="hero-heading">{profile.fullName}</h1>
            <p className="lead">{profile.role}</p>
          </div>
          <div>
            <div className="bio">
              {bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <ContactLinks email={email} linkedin={profile.linkedin} github={profile.github} />
          </div>
        </section>

        <section id="expertise" aria-labelledby="expertise-heading">
          <div className="section-heading">
            <h2 id="expertise-heading">Technical expertise</h2>
            <p>The tools and platforms I use to build production web applications.</p>
          </div>
          <ul className="skills">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>

        <section id="projects" aria-labelledby="projects-heading">
          <div className="section-heading">
            <h2 id="projects-heading">Selected projects</h2>
            <p>Production work and a personal project, ordered as published.</p>
          </div>
          <div className="project-grid">
            {featured ? <ProjectCard project={featured} featured /> : null}
            {otherProjects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </section>

        <section id="experience" aria-labelledby="experience-heading">
          <div className="section-heading">
            <h2 id="experience-heading">Professional experience</h2>
            <p>Most recent role first.</p>
          </div>
          <ol className="timeline">
            {experiences.map((experience) => (
              <li key={`${experience.company}-${experience.role}-${experience.startDate}`}>
                <article className="role">
                  <div className="role-meta">
                    <p className="dates">{formatDateRange(experience.startDate, experience.endDate)}</p>
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
            <h2 id="certifications-heading">Certifications</h2>
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
          <h2 id="contact-heading">Contact</h2>
          <p>For frontend roles and project conversations.</p>
          <ContactLinks email={email} linkedin={profile.linkedin} github={profile.github} />
        </section>
      </main>
    </>
  );
}

export function Unavailable() {
  return (
    <main id="content" className="unavailable">
      <p className="eyebrow">Alex Garulli</p>
      <h1>Portfolio temporarily unavailable</h1>
      <p>The published profile, experience and projects could not be loaded. Please try again shortly.</p>
    </main>
  );
}
