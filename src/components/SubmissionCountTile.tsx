import { useEffect, useState } from "react";
import { API_BASE } from "../api/client";

const SubmissionCountTile = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/submissions/count`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCount(data.count);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCount();
  }, []);

  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body d-flex flex-column justify-content-center align-items-center text-center p-4">
        <p className="text-muted text-uppercase fw-semibold small mb-2 letter-spacing-1">
          Total Submissions
        </p>

        {loading && (
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        )}

        {!loading && error && (
          <p className="text-danger mb-0">Failed to load</p>
        )}

        {!loading && !error && (
          <>
            <h1 className="display-2 fw-bold mb-0">{count}</h1>
            <small className="text-muted mt-1">files submitted</small>
          </>
        )}
      </div>
    </div>
  );
};

export default SubmissionCountTile;
