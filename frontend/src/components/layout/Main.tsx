import { NetworkCanvas } from "../features/NetworkCanvas";
import { NodeInspector } from "../features/NodeInspector";

export default function Main() {
  return (
    <main className="relative flex flex-1 overflow-hidden">
      <NetworkCanvas />
      <NodeInspector />
    </main>
  );
}
