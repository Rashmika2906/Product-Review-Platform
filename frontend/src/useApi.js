import { useEffect, useState } from "react";
import { api } from "./api";

/**
 * useApi("/products?search=mouse") loads a path and gives back:
 *   data    - the JSON (null while loading or after an error)
 *   error   - an error message ("" when fine)
 *   loading - true until the answer for THIS path has arrived
 *   reload  - call it to fetch the same path again (e.g. after adding a review)
 */
export function useApi(path) {
  const [result, setResult] = useState({ path: null, data: null, error: "" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false; // ignore answers that arrive after the page moved on
    api(path)
      .then((data) => {
        if (!cancelled) setResult({ path, data, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setResult({ path, data: null, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [path, reloadKey]);

  // "loading" is worked out, not stored: we are loading whenever the saved answer is for another path
  const loading = result.path !== path;
  return {
    data: loading ? null : result.data,
    error: loading ? "" : result.error,
    loading,
    reload: () => setReloadKey((key) => key + 1),
  };
}