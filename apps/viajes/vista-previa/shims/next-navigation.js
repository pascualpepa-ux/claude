import { navegar, useRuta } from "./router";

export function useRouter() {
  return { push: navegar, replace: navegar, back: () => navegar("/") };
}

export function useSearchParams() {
  return new URLSearchParams(useRuta().query);
}
