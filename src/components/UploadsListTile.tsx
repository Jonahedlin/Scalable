import { useEffect, useState } from "react";

interface Upload {
  id: string;
  name: string;
  status: "approved" | "pending" | "rejected";
  submittedAt: string;
}

const statusBadge: Record<Upload["status"], string> = {
  approved: "bg-success",
  pending: "bg-warning text-dark",
  rejected: "bg-danger",
};

const UploadsListTile = () => {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Mock GET /api/uploads
    const fetchUploads = async () => {
      try {
        await new Promise((r) => setTimeout(r, 1000));
        setUploads([
          { id: "1", name: "screenshot_001.png",      status: "approved", submittedAt: "2026-05-20" },
          { id: "2", name: "capture_dashboard.jpg",   status: "pending",  submittedAt: "2026-05-20" },
          { id: "3", name: "report_page2.png",         status: "rejected", submittedAt: "2026-05-19" },
          { id: "4", name: "invoice_scan.jpg",         status: "approved", submittedAt: "2026-05-19" },
          { id: "5", name: "form_filled.png",          status: "pending",  submittedAt: "2026-05-18" },
          { id: "6", name: "receipt_may18.jpg",        status: "approved", submittedAt: "2026-05-18" },
        ]);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUploads();
  }, []);

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <span className="fw-semibold">Recent Uploads</span>
        {!loading && !error && (
          <span className="badge bg-secondary">{uploads.length}</span>
        )}
      </div>

      <div className="card-body p-0">
        {loading && (
          <div className="d-flex justify-content-center py-4">
            <div className="spinner-border text-secondary" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        )}

        {!loading && error && (
          <p className="text-danger text-center py-4 mb-0">Failed to load uploads.</p>
        )}

        {!loading && !error && uploads.length === 0 && (
          <p className="text-muted text-center py-4 mb-0">No uploads yet.</p>
        )}

        {!loading && !error && uploads.length > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default UploadsListTile;
