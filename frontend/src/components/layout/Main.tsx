import { NetworkCanvas } from "../features/NetworkCanvas";
import { Aside } from "./Aside";

export const Main = () => {
  return (
    <main className="relative flex flex-1 overflow-hidden">
      <NetworkCanvas />
      <Aside />
    </main>
  );
};
