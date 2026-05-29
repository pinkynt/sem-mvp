import { getAdminZones } from "@/server/dashboard/queries";
import { ZonesManager } from "@/app/dashboard/(protected)/zonas/ZonesManager";

export const dynamic = "force-dynamic";

export default async function ZonesPage() {
  const zones = await getAdminZones();
  return <ZonesManager initialZones={zones} />;
}
