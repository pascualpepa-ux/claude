import { createElement } from "react";
import { navegar } from "./router";

export default function Link({ href, onClick, ...resto }) {
  return createElement("a", {
    ...resto,
    href,
    onClick: (e) => {
      onClick?.(e);
      if (e.defaultPrevented || String(href).startsWith("#")) return;
      e.preventDefault();
      navegar(String(href));
    },
  });
}
