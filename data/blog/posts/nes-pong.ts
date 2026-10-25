import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'nes-pong',
  title: 'Writing Games for the Nintendo Entertainment System (1985)',
  tags: ['8-bit', 'Assembly', 'Low Level Programming'],
  cover: '/blog/nes-pong.jpg',
  excerpt:
    'A guide towards developing a simple pong game for the NES using 8-bit 6502 assembly.',
  markdown: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`,
};

export default post;