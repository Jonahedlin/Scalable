import SubmissionCountTile from "./SubmissionCountTile";
import UploadsListTile from "./UploadsListTile";
import FileDropTile from "./FileDropTile";

interface Props {
  onSignOut: () => void;
}

const Dashboard = ({ onSignOut }: Props) => {
  return (
    <div className="min-vh-100 bg-light">

      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark px-4 shadow-sm">
        <span className="navbar-brand fw-bold fs-4">Scalable</span>
        <button
          type="button"
          className="btn btn-outline-light btn-sm"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </nav>

      {/* Page content */}
      <div className="container-fluid py-4 px-4">

        {/* Top row — Stats + File drop */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-4">
            <SubmissionCountTile />
          </div>
          <div className="col-12 col-md-8">
            <FileDropTile />
          </div>
        </div>

        {/* Bottom row — Uploads list */}
        <div className="row g-4">
          <div className="col-12">
            <UploadsListTile />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
