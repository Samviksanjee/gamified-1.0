import { useState } from 'react';
import { api } from '../../api.js';

export default function ReportsPanel() {
  const [reportType, setReportType] = useState('users');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const generateReport = async (type) => {
    setLoading(true);
    try {
      // TODO: Add superadmin reports endpoint to API
      setReportData({
        type,
        generatedAt: new Date().toISOString(),
        data: [],
      });
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-panel">
      <h2>Reports</h2>
      <div className="report-controls">
        <select 
          value={reportType} 
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="users">User Report</option>
          <option value="activities">Activity Report</option>
          <option value="performance">Performance Report</option>
          <option value="system">System Report</option>
        </select>
        <button 
          onClick={() => generateReport(reportType)}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
      
      {reportData && (
        <div className="report-result">
          <p>Report Type: {reportData.type}</p>
          <p>Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
          {reportData.data.length === 0 && <p>No data available</p>}
        </div>
      )}
    </div>
  );
}
