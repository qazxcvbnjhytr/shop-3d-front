// client/src/hooks/useSpecConfig.js
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Нормалізація помилок, щоб ти бачила "CONFIG_LOAD_FAILED" тільки коли реально треба
function toErrorCode(err) {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;

    if (status === 404) return "CONFIG_NOT_FOUND";
    if (status === 401) return "UNAUTHORIZED";
    if (status >= 500) return "SERVER_ERROR";

    // якщо немає response — це мережа/проксі/сервер не запущений
    if (!err.response) return "NETWORK_ERROR";
  }
  return "CONFIG_LOAD_FAILED";
}

export function useSpecConfig(typeKey) {
  const safeTypeKey = useMemo(() => {
    const k = String(typeKey || "").trim();
    return k || "default";
  }, [typeKey]);

  const [state, setState] = useState({
    template: null,
    fields: [],
    dictionaries: null,
    loading: false,
    error: "",
  });

  // кеш на сесію, щоб не тягнути одне й те саме 20 разів
  const cacheRef = useRef(new Map());

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const load = async () => {
      // якщо в кеші — віддаємо одразу
      const cached = cacheRef.current.get(safeTypeKey);
      if (cached) {
        setState({ ...cached, loading: false, error: "" });
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: "" }));

      try {
        // ВАЖЛИВО:
        // - тут навмисно йдемо на бекенд (5000), щоб не залежати від Vite proxy
        // - бо в тебе вже були ситуації, коли proxy "відвалювався"
        const url = `${API_URL}/api/spec-templates/${encodeURIComponent(safeTypeKey)}`;

        const { data } = await axios.get(url, { signal: controller.signal });

        const normalized = {
          template: data?.template ?? null,
          fields: Array.isArray(data?.fields) ? data.fields : [],
          dictionaries: data?.dictionaries ?? null,
        };

        cacheRef.current.set(safeTypeKey, normalized);

        if (!alive) return;
        setState({ ...normalized, loading: false, error: "" });
      } catch (err) {
        if (!alive) return;
        if (axios.isCancel(err)) return;

        const code = toErrorCode(err);
        setState((prev) => ({ ...prev, loading: false, error: code }));
      }
    };

    load();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [safeTypeKey]);

  return state;
}
