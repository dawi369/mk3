import { ACTIVE_VARIANT } from "./variant-config";
import V1HomePage from "./_variants/v1/page";
import V2HomePage from "./_variants/v2/page";

export default function Home() {
  switch (ACTIVE_VARIANT) {
    case "v2":
      return <V2HomePage />;
    case "v1":
      return <V1HomePage />;
    default:
      return <V1HomePage />;
  }
}
