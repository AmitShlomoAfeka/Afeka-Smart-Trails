import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-green-600 mb-8">
          מסלול טיולים אפקה 2026
        </h1>

        <p className="mt-3 text-2xl text-gray-900 max-w-2xl">
          Plan your perfect trekking or biking adventure with AI-powered routing.
          Explore the world safely and efficiently.
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <Link href="/plan" className="mt-6 text-xl bg-green-600 text-white py-4 px-10 rounded-full hover:bg-green-700 transition duration-300 shadow-lg hover:shadow-xl">
            Start Planning &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
