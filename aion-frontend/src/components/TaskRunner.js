import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';

const TaskRunner = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Load list of agents
    const fetchAgents = async () => {
      try {
        const response = await axios.get('http://localhost:8000/agents');
        setAgents(response.data);
        if (response.data.length > 0) {
          setSelectedAgent(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    fetchAgents();

    // Initialize WebSocket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:8000');
    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !taskId) return;

    // Listen for task updates
    socket.on(`task_update_${taskId}`, (data) => {
      if (data.output) {
        setOutput(data.output);
      }
      if (data.metrics) {
        setMetrics(data.metrics);
      }
      if (data.status === 'done') {
        setLoading(false);
      }
    });

    return () => {
      socket.off(`task_update_${taskId}`);
    };
  }, [socket, taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgent || !prompt) return;

    setLoading(true);
    setOutput('');
    setMetrics(null);

    try {
      const response = await axios.post('http://localhost:8000/run-task', {
        agent: selectedAgent,
        prompt: prompt
      });

      setTaskId(response.data.task_id);

      // Polling pentru rezultate (ca backup pentru WebSocket)
      const checkResult = async () => {
        try {
          const resultResponse = await axios.get(`http://localhost:8000/result/${response.data.task_id}`);
          if (resultResponse.data.status === 'done') {
            setOutput(resultResponse.data.output);
            setMetrics(resultResponse.data.metrics);
            setLoading(false);
          } else if (resultResponse.data.status === 'pending') {
            setTimeout(checkResult, 1000);
          }
        } catch (error) {
          console.error('Error checking result:', error);
          setLoading(false);
        }
      };

      checkResult();
    } catch (error) {
      console.error('Error running task:', error);
      setLoading(false);
    }
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <div className="mt-4 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Evaluation Metrics</h3>
        <div className="mt-2 grid grid-cols-4 gap-4">
          {Object.entries(metrics).map(([key, value]) => (
            key !== 'error' && (
              <div key={key} className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-500">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{value.toFixed(1)}</p>
              </div>
            )
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Task Runner</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="agent" className="block text-sm font-medium text-gray-700 mb-1">
              Select Agent
            </label>
            <select
              id="agent"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select an agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
              Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your prompt here..."
              required
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? 'Processing...' : 'Run Task'}
            </button>
          </div>
        </form>
      </div>
      
      {loading && (
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      )}
      
      {output && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Output</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{output}</pre>
          </div>
        </div>
      )}
      
      {renderMetrics()}
    </div>
  );
};

export default TaskRunner;