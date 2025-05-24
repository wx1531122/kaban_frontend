import React, { useState } from 'react'; // Added useState
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ProjectList from './components/ProjectList';
import ProjectBoard from './components/ProjectBoard';
import { fetchHello } from './services/api'; // Import fetchHello

function App() {
  const [helloMessage, setHelloMessage] = useState('');
  const [helloError, setHelloError] = useState('');

  const handleFetchHello = async () => {
    try {
      setHelloError('');
      setHelloMessage('');
      const message = await fetchHello();
      setHelloMessage(message);
    } catch (error) {
      setHelloError(error.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>Project Management App</h1>
          </Link>
        </div>
        <div style={{ marginTop: '10px' }}>
          <button onClick={handleFetchHello} className="btn btn-sm btn-light">Test Backend /hello</button>
          {helloMessage && <p style={{ color: 'lightgreen', fontSize: '0.8em', marginTop: '5px' }}>{helloMessage}</p>}
          {helloError && <p style={{ color: 'coral', fontSize: '0.8em', marginTop: '5px' }}>Error: {helloError}</p>}
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects/:projectId" element={<ProjectBoard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
