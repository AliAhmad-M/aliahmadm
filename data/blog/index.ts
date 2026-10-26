import type { BlogPost } from './types';

import ecsInCpp from './posts/ecs-in-cpp';
import sprite2D from './posts/sprites-2d';
import clothPhysics from './posts/cloth-physics';
import gravitySim from './posts/gravity-sim';
import simple3D from './posts/simple-3d';
import nesPong from './posts/nes-pong';
import collision2D from './posts/collision-2d';

export type { BlogPost };

export const blogs: BlogPost[] = [
    ecsInCpp,
    sprite2D,
    clothPhysics,
    // gravitySim,
    // simple3D,
    // nesPong,
    // collision2D,
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogs.find((b) => b.slug === slug);
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}