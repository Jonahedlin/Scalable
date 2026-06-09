import { useEffect, useState } from "react";
import { API_BASE } from "../api/client";
import { useToast } from "../context/ToastContext";

// ─── constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 4;

// ─── types ────────────────────────────────────────────────────────────────────
interface Upload {
  id: string;
  name: string;
  status: "approved" | "pending" | "rejected";
  submittedAt: string;
}

interface FetchResult {
  uploads: Upload[];
  hasMore: boolean;
  total: number;
}

// GET /api/uploads?offset=N&limit=N
// Response shape: { uploads: Upload[], hasMore: boolean, total: number }
const apiFetch = async (offset: number, limit: number): Promise<FetchResult> => {
  const res = await fetch(`${API_BASE}/api/uploads?offset=${offset}&limit=${limit}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ─── badge colours ────────────────────────────────────────────────────────────
const statusBadge: Record<Upload["status"], string> = {
  approved: "bg-success",
  pending:  "bg-warning text-dark",
  rejected: "bg-danger",
};

// ─── component ────────────────────────────────────────────────────────────────
const UploadsListTile = () => {
  const { addToast } = useToast();

  const [uploads,     setUploads]     = useState<Upload[]>([]);
  const [total,       setTotal]       = useState(0);
  const [hasMore,     setHasMore]     = useState(false);
  const [offset,      setOffset]      = useState(0);
  const [loading,     setLoading]     = useState(true);   // initial fetch
  const [loadingMore, setLoadingMore] = useState(false);  // load-more fetch
  const [error,       setError]       = useState(false);

  // ── initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const result = await apiFetch(0, PAGE_SIZE);
        setUploads(result.uploads);
        setTotal(result.total);
        setHasMore(result.hasMore);
        setOffset(PAGE_SIZE);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── load more ─────────────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await apiFetch(offset, PAGE_SIZE);
      setUploads((prev) => [...prev, ...result.uploads]);
      setHasMore(result.hasMore);
      setOffset((prev) => prev + PAGE_SIZE);
    } catch {
      addToast("Failed to load more uploads. Please try again.", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="card shadow-sm">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <span className="fw-semibold">Recent Uploads</span>
        {!loading && !error && (
          <span className="badge bg-secondary">
            {uploads.length}{hasMore ? ` of ${total}` : ` of ${total}`}
          </span>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="card-body p-0">

        {/* Initial load spinner */}
        {loading && (
          <div className="d-flex justify-content-center py-4">
            <div className="spinner-border text-secondary" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        )}

        {/* Initial load error */}
        {!loading && error && (
          <p className="text-danger text-center py-4 mb-0">
            Failed to load uploads.
          </p>
        )}

        {/* Empty state */}
        {!loading && !error && uploads.length === 0 && (
          <p className="text-muted text-center py-4 mb-0">No uploads yet.</p>
        )}

        {/* Table */}
        {!loading && !error && uploads.length > 0 && (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">File Name</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u) => (
                    <tr key={u.id}>
                      <td className="text-break fw-medium">{u.name}</td>
                      <td className="text-muted small">{u.submittedAt}</td>
                      <td>
                        <span className={`badge ${statusBadge[u.status]}`}>
                          {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Load More / End of list ─────────────────────────────── */}
            <div className="d-flex justify-content-center py-3 border-top">
              {hasMore ? (
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm px-4"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Loading…
                    </>
                  ) : (
                    "Load More"
                  )}
                </button>
              ) : (
                <small className="text-muted">
                  All {total} upload{total !== 1 ? "s" : ""} shown
                </small>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadsListTile;
