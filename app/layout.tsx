import './globals.css';

export const metadata = {
  title: 'Ali Ahmad | Software Developer',
  description: 'Portfolio of Ali Ahmad',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}