export type BlogPost = {
  slug: string;
  title: string;
  tags: string[];   
  cover?: string;   // image path
  excerpt: string;
  markdown: string;
};