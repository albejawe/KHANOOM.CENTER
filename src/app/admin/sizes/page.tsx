import { getAllSizes } from "@/lib/queries";
import SizesManager from "./SizesManager";

export const instant = false;

export default async function AdminSizesPage() {
  const sizes = await getAllSizes();

  return <SizesManager initialSizes={sizes} />;
}
