export const professionalLinks = {
  LinkedIn: "https://www.linkedin.com/in/nicolas-de-jesus-silva",
  GitHub: "https://github.com/NxcolasDev",
  Credly: "",
};

export const publicProfessionalLinks = Object.entries(professionalLinks).flatMap(([label, url]) =>
  url ? [{ label, url }] : [],
);

export const projectLinks: Partial<Record<string, { github?: string; linkedin?: string; credly?: string }>> = {
  "nicolas-hub": { github: "https://github.com/NxcolasDev/NicolasHub" },
  gestoriq: { github: "https://github.com/NxcolasDev/GestorIQ-1" },
  elan: { github: "https://github.com/NxcolasDev/Elanv2" },
  corner: { github: "https://github.com/NxcolasDev/Corner" },
  mensageria: {},
};

export const referenceLinks = {
  architecture: "https://github.com/NxcolasDev/NicolasHub/blob/main/docs/arquitetura-multicloud.md",
  kiro: "https://github.com/NxcolasDev/desafio-apagao-technova-6325171/blob/main/relatorio-kiro.md",
  bigData: "https://github.com/NxcolasDev/prova_bigdata_2026",
  awsBadges: "https://www.credly.com/organizations/amazon-web-services/collections/emerging-talent-community/badge_templates",
};
