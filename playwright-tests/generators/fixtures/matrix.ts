import { resolve } from "path";

export type PrimitiveType = "string" | "number" | "boolean" | "Date";

export type PrimitiveProperty = {
  kind: "primitive";
  property: string;
  type: PrimitiveType;
  isOptional: boolean;
  isShowInTable: boolean;
};

export type ReferenceProperty = {
  kind: "reference" | "denormalized";
  property: string;
  type: string;
  referenceType: "toOne" | "toMany";
  propertyForSelect?: string;
  isOptional: boolean;
  isShowInTable: boolean;
};

export type GeneratedProperty = PrimitiveProperty | ReferenceProperty;

export type GeneratedEntity = {
  name: string;
  properties: GeneratedProperty[];
};

export type EntityPaths = {
  entityType: string;
  apiService: string;
  listPage: string;
  listPageContent: string;
  createPage: string;
  createPageContent: string;
  editPage: string;
  editPageContent: string;
  queries: string;
  i18nList: string;
  i18nCreate: string;
  i18nEdit: string;
};

const kebabCase = (input: string): string =>
  input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

const pluralizeKebab = (kebab: string): string => {
  if (kebab.endsWith("y") && !/[aeiou]y$/.test(kebab)) {
    return `${kebab.slice(0, -1)}ies`;
  }
  if (/(s|x|z|ch|sh)$/.test(kebab)) {
    return `${kebab}es`;
  }
  return `${kebab}s`;
};

export const entityFileName = (entityName: string): string =>
  kebabCase(entityName);

export const entityRouteSegment = (entityName: string): string =>
  pluralizeKebab(kebabCase(entityName));

export const entityPaths = (
  entityName: string,
  srcRoot: string
): EntityPaths => {
  const file = entityFileName(entityName);
  const route = entityRouteSegment(entityName);
  // Pola konsisten: implementasi di app/[language]/admin/<route>/,
  // wrapper canonical di app/admin/<route>/page.tsx.
  const implDir = resolve(srcRoot, "app", "[language]", "admin", route);
  const legacyDir = resolve(srcRoot, "app", "admin", route);
  const i18nDir = resolve(srcRoot, "services", "i18n", "locales", "en");

  return {
    entityType: resolve(srcRoot, "services", "api", "types", `${file}.ts`),
    apiService: resolve(srcRoot, "services", "api", "services", `${route}.ts`),
    listPage: resolve(legacyDir, "page.tsx"),
    listPageContent: resolve(implDir, "page-content.tsx"),
    createPage: resolve(legacyDir, "create", "page.tsx"),
    createPageContent: resolve(implDir, "create", "page-content.tsx"),
    editPage: resolve(legacyDir, "edit", "[id]", "page.tsx"),
    editPageContent: resolve(implDir, "edit", "[id]", "page-content.tsx"),
    queries: resolve(implDir, "queries", "queries.ts"),
    i18nList: resolve(i18nDir, `admin-${route}.json`),
    i18nCreate: resolve(i18nDir, `admin-${route}-create.json`),
    i18nEdit: resolve(i18nDir, `admin-${route}-edit.json`),
  };
};

export type Matrix = {
  entities: GeneratedEntity[];
};

export const matrix: Matrix = {
  entities: [
    {
      name: "Tag",
      properties: [
        {
          kind: "primitive",
          property: "name",
          type: "string",
          isOptional: false,
          isShowInTable: true,
        },
      ],
    },
    {
      name: "BlogComment",
      properties: [
        {
          kind: "primitive",
          property: "text",
          type: "string",
          isOptional: false,
          isShowInTable: true,
        },
      ],
    },
    {
      name: "Article",
      properties: [
        {
          kind: "primitive",
          property: "title",
          type: "string",
          isOptional: false,
          isShowInTable: true,
        },
        {
          kind: "primitive",
          property: "subtitle",
          type: "string",
          isOptional: true,
          isShowInTable: false,
        },
        {
          kind: "primitive",
          property: "views",
          type: "number",
          isOptional: false,
          isShowInTable: true,
        },
        {
          kind: "primitive",
          property: "isPublished",
          type: "boolean",
          isOptional: false,
          isShowInTable: true,
        },
        {
          kind: "primitive",
          property: "publishedAt",
          type: "Date",
          isOptional: true,
          isShowInTable: false,
        },
        {
          kind: "reference",
          property: "coverImage",
          type: "File",
          referenceType: "toOne",
          isOptional: true,
          isShowInTable: false,
        },
        {
          kind: "reference",
          property: "author",
          type: "User",
          referenceType: "toOne",
          propertyForSelect: "email",
          isOptional: false,
          isShowInTable: true,
        },
        {
          kind: "reference",
          property: "tags",
          type: "Tag",
          referenceType: "toMany",
          propertyForSelect: "name",
          isOptional: true,
          isShowInTable: false,
        },
        {
          kind: "denormalized",
          property: "denormalizedAuthor",
          type: "User",
          referenceType: "toOne",
          propertyForSelect: "email",
          isOptional: false,
          isShowInTable: false,
        },
      ],
    },
  ],
};
