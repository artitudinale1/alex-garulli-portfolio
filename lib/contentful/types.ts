export type Profile = {
  fullName: string;
  role: string;
  bio: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
};

export type Experience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string;
  technologies: string[];
  displayOrder: number;
};

export type Project = {
  title: string;
  description: string;
  technologies: string[];
  repositoryUrl: string | null;
  demoUrl: string | null;
  displayOrder: number;
};

export type Portfolio = {
  profile: Profile;
  experiences: Experience[];
  projects: Project[];
};
