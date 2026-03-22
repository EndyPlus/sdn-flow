import { ReactFlowProvider } from "@xyflow/react";
import { Header } from "../components/layout/Header";
import { Main } from "../components/layout/Main";

export const App = () => {
  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col">
        <Header />
        <Main />
      </div>
    </ReactFlowProvider>
  );
};
