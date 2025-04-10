import VacationFinder from "./components/vacation-finder";

export default function Home() {
  return (
    <main className="flex min-h-screen sm:flex-row flex-col items-center justify-center p-4 md:p-24">
      <VacationFinder />
    </main>
  );
}
