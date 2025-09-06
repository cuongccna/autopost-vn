'use client';

import { useState } from 'react';
import ActivityLogsDemo from '@/components/features/ActivityLogsDemo';

export default function ActivityLogsTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runApiTest = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/test/activity-logs?type=basic');
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔬 Activity Logs System Test
          </h1>
          <p className="text-gray-600 mb-6">
            Trang test hệ thống nhật ký hoạt động AutoPost VN. Kiểm tra database connection, API endpoints và UI components.
          </p>
          
          {/* Quick API Test */}
          <div className="flex items-center gap-4">
            <button
              onClick={runApiTest}
              disabled={testing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : '🧪 Test API'}
            </button>
            
            {testResult && (
              <div className={`px-3 py-1 rounded-full text-sm ${
                testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {testResult.success ? '✅ API OK' : '❌ API Error'}
              </div>
            )}
          </div>
          
          {/* Test Results */}
          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Test Results:</h3>
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 System Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🗄️</span>
                <div>
                  <p className="font-medium text-green-900">Database</p>
                  <p className="text-sm text-green-700">Migration applied</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔗</span>
                <div>
                  <p className="font-medium text-blue-900">API Endpoints</p>
                  <p className="text-sm text-blue-700">Ready to test</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎨</span>
                <div>
                  <p className="font-medium text-purple-900">UI Components</p>
                  <p className="text-sm text-purple-700">Interactive demo</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔒</span>
                <div>
                  <p className="font-medium text-yellow-900">Security</p>
                  <p className="text-sm text-yellow-700">RLS enabled</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ✨ Features Implemented
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">📝 Logging Features</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ User activity tracking</li>
                <li>✅ Categorized actions (auth, post, account, workspace, admin, api)</li>
                <li>✅ Success/failed/warning status</li>
                <li>✅ Request context (IP, User-Agent, Request ID)</li>
                <li>✅ Performance metrics (duration_ms)</li>
                <li>✅ Audit trail (previous_data, new_data)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🔍 Query Features</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ Filter by category, status, date range</li>
                <li>✅ Pagination support</li>
                <li>✅ User-specific logs</li>
                <li>✅ Workspace logs</li>
                <li>✅ Activity statistics</li>
                <li>✅ Automatic cleanup</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🎨 UI Features</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ Interactive log viewer</li>
                <li>✅ Real-time filtering</li>
                <li>✅ Status indicators</li>
                <li>✅ Expandable details</li>
                <li>✅ Activity statistics dashboard</li>
                <li>✅ Responsive design</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🔒 Security Features</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ Row Level Security (RLS)</li>
                <li>✅ User isolation</li>
                <li>✅ Workspace access control</li>
                <li>✅ Service role permissions</li>
                <li>✅ Session validation</li>
                <li>✅ Data encryption ready</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Component */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ActivityLogsDemo />
        </div>

        {/* API Documentation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📚 API Documentation
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900">Available Endpoints:</h3>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/activity-logs</code> - Create new log entry</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/activity-logs</code> - Get user logs with filters</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/activity-logs/workspace/[id]</code> - Get workspace logs</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/activity-logs/stats</code> - Get activity statistics</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/test/activity-logs</code> - Test endpoints (dev only)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">React Hooks:</h3>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">useActivityLogs()</code> - Fetch and manage logs</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">useLogActivity()</code> - Create log entries</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">useActivityStats()</code> - Get activity statistics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
