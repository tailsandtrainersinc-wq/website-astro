import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Site-wide copy (hero, CTA, footer) — edit src/content/site/settings.md
const site = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/site" }),
  schema: z.object({
    heroTitle: z.string(),
    heroSubtitle: z.string(),
    heroTagline: z.string().optional(),
    ctaTitle: z.string(),
    ctaBody: z.string(),
    footerDescription: z.string(),
  }),
});

// Feature/mission pillars — add or edit .md files in src/content/features
const features = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/features" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string(), // Tabler icon name, e.g. "tabler:school"
    order: z.number().optional().default(0),
  }),
});

export const collections = {
  site,
  features,
};
