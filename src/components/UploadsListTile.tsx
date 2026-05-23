import { useEffect, useState } from "react";
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

// ─── mock data (replace with real API) ───────────────────────────────────────
const MOCK_UPLOADS: Upload[] = [
  { id: "1",  name: "screenshot_001.png",    status: "approved", submittedAt: "2026-05-23" },
  { id: "2",  name: "capture_dashboard.jpg", status: "pending",  submittedAt: "2026-05-23" },
  { id: "3",  name: "report_page2.png",      status: "rejected", submittedAt: "2026-05-22" },
  { id: "4",  name: "invoice_scan.jpg",      status: "approved", submittedAt: "2026-05-22" },
  { id: "5",  name: "form_filled.png",       status: "pending",  submittedAt: "2026-05-21" },
  { id: "6",  name: "receipt_may21.jpg",     status: "approved", submittedAt: "2026-05-21" },
  { id: "7",  name: "passport_scan.jpg",     status: "approved", submittedAt: "2026-05-20" },
  { id: "8",  name: "bank_statement.png",    status: "pending",  submittedAt: "2026-05-20" },
  { id: "9",  name: "utility_bill.jpg",      status: "rejected", submittedAt: "2026-05-19" },
  { id: "10", name: "id_card_front.png",     status: "approved", submittedAt: "2026-05-19" },
  { id: "11", name: "id_card_back.png",      status: "approved", submittedAt: "2026-05-18" },
  { id: "12", name: "selfie_verify.jpg",     status: "pending",  submittedAt: "2026-05-18" },
];

// Mock GET /api/uploads?offset=N&limit=N
// Replace with: fetch(`/api/uploads?offset=${offset}&limit=${limit}`)
// Expected response shape: { uploads: Upload[], hasMore: boolean, total: number }
const mockFetch = async (offset: number, limit: number): Promise<FetchResult> => {
  await new Promise((r) => setTimeout(r, 800));
  const slice = MOCK_UPLOADS.slice(offset, offset + limit);
  return {
    uploads: slice,
    hasMore: offset + limit < MOCK_UPLOADS.length,
    total:   MOCK_UPLOADS.length,
  };
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
        const result = await mockFetch(0, PAGE_SIZE);
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
      const result = await mockFetch(offset, PAGE_SIZE);
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
