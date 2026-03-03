import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Afeka Hiking Trails 2026',
  description: 'Plan your next adventure with AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
