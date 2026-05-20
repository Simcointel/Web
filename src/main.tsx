import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./App";
import { RouterProvider, createRouter } from "./router";
import "./index.css";

function Main() {
  const router = createRouter();
  return (
    <RouterProvider value={router}>
      <AppShell path={router.path} />
    </RouterProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Main />
  </StrictMode>,
);
