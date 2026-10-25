import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'simple-3d',
  title: '3D Rendering Using Weak Perspective Projection',
  tags: ['C', 'OpenGL'],
  cover: '/blog/simple-3d.jpg',
  excerpt:
    'A guide towards implementing basic 3D rendering in C using weak perspective projection.',
  markdown: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
};

export default post;