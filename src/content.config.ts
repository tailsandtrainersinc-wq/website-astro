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

// Events for calendar — add or edit .md files in src/content/events
const events = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.union([z.string(), z.date()]).transform((v) =>
      typeof v === "string" ? v : v.toISOString().slice(0, 10)
    ),
    endDate: z.union([z.string(), z.date()]).transform((v) =>
      typeof v === "string" ? v : v.toISOString().slice(0, 10)
    ).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    parentEvent: z.string().optional(), // slug of parent event (e.g. a con this show belongs to)
  }),
});

export const collections = {
  site,
  features,
  events,
};
