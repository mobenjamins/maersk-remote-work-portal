import { useState, useEffect } from 'react';
import { getAdminDashboard, getAdminRequests } from '../services/api';
import { AdminAnalytics, AdminRequest } from '../types';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, [statusFilter]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [analyticsData, requestsData] = await Promise.all([
        getAdminDashboard(),
        getAdminRequests(statusFilter ? { status: statusFilter } : undefined),
      ]);

      setAnalytics(analyticsData);
      setRequests(requestsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={loadDashboard}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Analytics KPI Cards */}
      {analytics && (
        <section className="analytics-section">
          <h2>Overview</h2>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-value">{analytics.total_requests}</div>
              <div className="kpi-label">Total Requests</div>
            </div>
            <div className="kpi-card approved">
              <div className="kpi-value">{analytics.approved_requests}</div>
              <div className="kpi-label">Approved</div>
            </div>
            <div className="kpi-card rejected">
              <div className="kpi-value">{analytics.rejected_requests}</div>
              <div className="kpi-label">Rejected</div>
            </div>
            <div className="kpi-card escalated">
              <div className="kpi-value">{analytics.escalated_requests}</div>
              <div className="kpi-label">Escalated</div>
            </div>
            <div className="kpi-card users">
              <div className="kpi-value">{analytics.total_users}</div>
              <div className="kpi-label">Total Users</div>
            </div>
            <div className="kpi-card rate">
              <div className="kpi-value">{analytics.approval_rate.toFixed(1)}%</div>
              <div className="kpi-label">Approval Rate</div>
            </div>
          </div>
        </section>
      )}

      {/* Request Manager */}
      <section className="requests-section">
        <div className="requests-header">
          <h2>Remote Work Requests</h2>
          <div className="requests-filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="escalated">Escalated</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {requests.length === 0 ? (
          <p className="no-requests">No requests found</p>
        ) : (
          <div className="requests-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>From Country</th>
                  <th>To Country</th>
                  <th>Duration</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className={`status-${request.status}`}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{request.user_name}</div>
                        <div className="user-email">{request.user_email}</div>
                      </div>
                    </td>
                    <td>{request.home_country}</td>
                    <td>{request.destination_country}</td>
                    <td>{request.duration_days} days</td>
                    <td>{new Date(request.start_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${request.status}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
