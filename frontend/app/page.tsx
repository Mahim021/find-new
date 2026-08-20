import { getMuseumData } from "@/lib/get-museum-data";
import MuseumApp from "@/components/museum/MuseumApp";

export default async function Home() {
  const data = await getMuseumData();
  return <MuseumApp data={data} />;
}
