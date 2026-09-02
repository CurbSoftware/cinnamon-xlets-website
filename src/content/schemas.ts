import { z } from 'astro/zod';
import type { ImageFunction } from 'astro:content';

// Xlet collection schema. Takes the astro:content { image } helper so the
// same schema runs at build time (real image validation) and in vitest
// (fake helper returning a plain string, see schemas.test.ts).
export const xletSchema = ({ image }: { image: ImageFunction }) =>
  z.object({
    uuid: z.string().regex(/^cinnamon-[a-z-]+@curbsoftware$/),
    name: z.string().min(1),
    kind: z.enum(['desklet', 'applet']),
    version: z.string().min(1),
    tagline: z.string().min(1),
    summary: z.string().min(1),
    order: z.number().int(),
    repo: z.url(),
    // Spices merges are in flight; null until they land.
    spicesUrl: z.url().nullable().default(null),
    derivedFrom: z
      .object({
        name: z.string().min(1),
        url: z.url(),
      })
      .nullable()
      .default(null),
    license: z.literal('GPL-2.0-or-later'),
    accentHue: z.number().min(0).max(360),
    // True only for xlets whose hero shot is an extreme strip (workspace-names):
    // the hero renders as a full-bleed band instead of a framed screenshot.
    heroBand: z.boolean().default(false),
    features: z.array(z.string().min(1)).min(3),
    shot: image(),
    configShot: image(),
    desk: image().optional(),
  });

export type Xlet = z.infer<ReturnType<typeof xletSchema>>;
