import { StrictMode, useEffect, useState, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Phone from "./Phone";
import { syncPublished } from "./store";

syncPublished();

const Editor = lazy(() => import("./Editor"));
const IconSheet = lazy(() => import("./IconSheet"));

/* /editor 경로 또는 #/editor 해시로 제작자 편집 화면 */
const isEditor = () => location.hash.startsWith("#/editor") || /\/editor\/?$/.test(location.pathname);

function Root() {
  const [ed, setEd] = useState(isEditor());
  useEffect(() => {
    const f = () => setEd(isEditor());
    window.addEventListener("hashchange", f);
    window.addEventListener("popstate", f);
    return () => {
      window.removeEventListener("hashchange", f);
      window.removeEventListener("popstate", f);
    };
  }, []);
  if (location.hash.startsWith("#/icons"))
    return (
      <Suspense fallback={null}>
        <IconSheet />
      </Suspense>
    );
  return ed ? (
    <Suspense fallback={null}>
      <Editor />
    </Suspense>
  ) : (
    <Phone />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
