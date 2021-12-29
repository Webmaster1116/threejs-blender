import load from "load-script";
export const wait = (x: number, signal?: AbortSignal) => {
  return new Promise((s, f) => {
    const id = setTimeout(s, x, x);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      f("AbortError");
    });
  });
};

export const loadScript = (path: string, opts: any = {}) =>
  new Promise((s, f) =>
    load(path, opts, (err: Error, script: HTMLScriptElement) =>
      err ? f(err) : s(script)
    )
  );
