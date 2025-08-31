import { useState } from 'react';
import './App.css';
import ResultsTable from './ResultsTable'; // <-- 1. IMPORT THE NEW COMPONENT

function App() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:3000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError('Failed to fetch response. Is the server running?');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Employee Data Chatbot 🤖</h1>
      <p className="subtitle">Ask a question about the employee database in plain English.</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What is the average salary?"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Ask Question'}
        </button>
      </form>

      <div className="response-area">
        {isLoading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {response && (
          <div className="response-card">
            <h2>Answer</h2>
            <p className="answer">{response.answer}</p>

            <h3>Generated SQL</h3>
            <pre className="sql-code">{response.sql}</pre>
            
            <h3>Raw Data</h3>
            {/* -- 2. REPLACE THE <pre> TAG WITH THE ResultsTable COMPONENT -- */}
            <div className="table-container">
              <ResultsTable data={response.rawResults} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;