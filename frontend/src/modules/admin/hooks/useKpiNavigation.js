import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function useKpiNavigation() {
  const navigate = useNavigate();

  return useCallback((path, filter) => {
    const search = new URLSearchParams();
    if (filter) search.set("filter", filter);
    const recordsPath = filter && !path.endsWith("/records")
      ? `${path.replace(/\/$/, "")}/records`
      : path;
    navigate(`${recordsPath}${search.size ? `?${search.toString()}` : ""}`);
  }, [navigate]);
}

export function useKpiFilter(defaultFilter = "") {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || defaultFilter;
  const setFilter = useCallback((value, options) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value && value !== defaultFilter) nextParams.set("filter", value);
    else nextParams.delete("filter");
    setSearchParams(nextParams, options);
  }, [defaultFilter, searchParams, setSearchParams]);

  return [filter, setFilter];
}

export function useKpiScopedState(filter, initialValue) {
  const [state, setState] = useState(() => ({ filter, value: initialValue }));
  const value = state.filter === filter ? state.value : initialValue;
  const setValue = useCallback((nextValue) => {
    setState((current) => {
      const currentValue = current.filter === filter ? current.value : initialValue;
      return {
        filter,
        value: typeof nextValue === "function" ? nextValue(currentValue) : nextValue,
      };
    });
  }, [filter, initialValue]);

  return [value, setValue];
}
