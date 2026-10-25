import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'collision-2d',
  title: '2D Collision Detection Using the Separating Axis Theorem (SAT) And Collision Resolution',
  tags: ['C#', 'Gamedev', 'Physics'],
  cover: '/blog/collision-2d.jpg',
  excerpt:
    'An explanation on the Separating Axis Theorem for 2D collision detection and on how to resolve collisions.',
  markdown: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
};

export default post;