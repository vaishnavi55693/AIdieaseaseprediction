import { useEffect, useState } from "react";
import api from "./api/client";

export function useDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then(({ data: summary }) => setData(summary))
      .catch(() => setData(null));
  }, []);

  return { data };
}
