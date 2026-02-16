export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "tags";
  required?: boolean;
}

export interface CollectionSchema {
  label: string;
  fields: FieldDef[];
  hasBody: boolean;
  canCreate: boolean;
  canDelete: boolean;
}

export const collectionSchemas: Record<string, CollectionSchema> = {
  site: {
    label: "Site Settings",
    fields: [
      { name: "heroTitle", label: "Hero Title", type: "text", required: true },
      { name: "heroSubtitle", label: "Hero Subtitle", type: "textarea", required: true },
      { name: "heroTagline", label: "Hero Tagline", type: "text" },
      { name: "ctaTitle", label: "CTA Title", type: "text", required: true },
      { name: "ctaBody", label: "CTA Body", type: "textarea", required: true },
      { name: "footerDescription", label: "Footer Description", type: "textarea", required: true },
    ],
    hasBody: false,
    canCreate: false,
    canDelete: false,
  },
  features: {
    label: "Features",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "icon", label: "Icon", type: "text", required: true },
      { name: "order", label: "Order", type: "number" },
    ],
    hasBody: true,
    canCreate: true,
    canDelete: true,
  },
  events: {
    label: "Events",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "date", label: "Start Date", type: "date", required: true },
      { name: "endDate", label: "End Date", type: "date" },
      { name: "startTime", label: "Start Time", type: "text" },
      { name: "endTime", label: "End Time", type: "text" },
      { name: "location", label: "Location", type: "text" },
      { name: "tags", label: "Tags", type: "tags" },
      { name: "parentEvent", label: "Parent Event (slug)", type: "text" },
    ],
    hasBody: true,
    canCreate: true,
    canDelete: true,
  },
};
