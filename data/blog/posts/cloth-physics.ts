import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'cloth-physics',
  title: '2D and 3D Cloth Physics Simulations from Scratch',
  tags: ['C', 'OpenGL', 'Physics'],
  cover: '/blog/cloth-physics.jpg',
  excerpt:
    'An explanation on how cloth simulations are implemented using particle physics and constraints',
  markdown: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
};

export default post;