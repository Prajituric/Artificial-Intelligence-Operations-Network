import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Înregistrăm componentele Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    averageScore: 0,
    agentPerformance: []
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulăm datele pentru dashboard
    // În implementarea reală, acestea ar veni de la API
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Simulăm date pentru statistici
        setStats({
          totalTasks: 120,
          completedTasks: 98,
          averageScore: 8.7,
          agentPerformance: [
            { agent: 'Code Reviewer', averageScore: 9.2, tasksCompleted: 45 },
            { agent: 'Security Auditor', averageScore: 8.5, tasksCompleted: 30 },
            { agent: 'Data Analyst', averageScore: 8.9, tasksCompleted: 15 },
            { agent: 'Documentation Writer', averageScore: 7.8, tasksCompleted: 8 }
          ]
        });
        
        // Simulăm date pentru task-uri recente
        setRecentTasks([
          { id: 'task123', agent: 'Code Reviewer', prompt: 'Review this React component', status: 'completed', score: 9.5, createdAt: '2023-11-20T14:30:00Z' },
          { id: 'task124', agent: 'Security Auditor', prompt: 'Check for SQL injection', status: 'completed', score: 8.7, createdAt: '2023-11-19T10:15:00Z' },
          { id: 'task125', agent: 'Data Analyst', prompt: 'Analyze this dataset', status: 'completed', score: 9.1, createdAt: '2023-11-18T16:45:00Z' },
          { id: 'task126', agent: 'Documentation Writer', prompt: 'Generate API docs', status: 'pending', score: null, createdAt: '2023-11-17T09:20:00Z' }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const performanceData = {
    labels: stats.agentPerformance.map(item => item.agent),
    datasets: [
      {
        label: 'Average Score',
        data: stats.agentPerformance.map(item => item.averageScore),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }
    ]
  };

  const tasksCompletedData = {
    labels: stats.agentPerformance.map(item => item.agent),
    datasets: [
      {
        label: 'Tasks Completed',
        data: stats.agentPerformance.map(item => item.tasksCompleted),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      }
    ]
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Total Tasks</h2>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalTasks}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Completed Tasks</h2>
          <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Average Score</h2>
          <p className="text-3xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Agent Performance</h2>
          <Bar data={performanceData} options={{ responsive: true }} />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks Completed by Agent</h2>
          <Bar data={tasksCompletedData} options={{ responsive: true }} />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-medium text-gray-900 p-6 pb-0">Recent Tasks</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.agent}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.prompt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.score ? task.score.toFixed(1) : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(task.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;