import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProjects, createProject, deleteProject } from '../services/api';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (projectId) => {
    setIsLoading(true);
    try {
      await deleteProject(projectId);
      await loadProjects(); 
    } catch (err) {
      setError(err.message || 'Failed to delete project');
    } finally {
      setIsLoading(false); 
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError('Project name is required.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await createProject({ name: projectName, description: projectDescription });
      setProjectName('');
      setProjectDescription('');
      await loadProjects();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && projects.length === 0) {
    return <div className="alert alert-info">Loading projects...</div>;
  }

  return (
    <div className="project-list-container">
      <h2>Projects</h2>

      {error && <div className="alert alert-danger" role="alert">Error: {error}</div>}
      {isLoading && projects.length > 0 && <div className="alert alert-info" role="status">Updating...</div>}

      <form onSubmit={handleCreateProject} className="form-container">
        <h3>Create New Project</h3>
        <div className="form-group">
          <label htmlFor="projectName">Name:</label>
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="projectDescription">Description:</label>
          <input
            type="text"
            id="projectDescription"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Project'}
        </button>
      </form>

      {projects.length === 0 && !isLoading && !error ? (
        <p>No projects found. Create one above!</p>
      ) : (
        <ul className="list-unstyled">
          {projects.map((project) => (
            <li key={project.id || project.name} className="list-item-card">
              <h3>{project.name}</h3>
              <p>{project.description || "No description provided."}</p>
              <div className="list-item-actions">
                <Link to={`/projects/${project.id || project.name}`} className="btn btn-secondary btn-sm">
                  View/Edit
                </Link>
                <button 
                  onClick={() => handleDelete(project.id || project.name)} 
                  className="btn btn-danger btn-sm" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProjectList;
