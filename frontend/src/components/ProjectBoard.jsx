import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  fetchProjectDetails, 
  updateStage,
  createStage,
  deleteStage,
  createTask,
  updateTask,
  deleteTask,
  createSubtask, // New
  updateSubtask, // New
  deleteSubtask  // New
} from '../services/api';
import './ProjectBoard.css';

// Basic Task Modal
const TaskModal = ({ task, stageId, onSave, onClose, isUpdating }) => {
  const [content, setContent] = useState(task ? task.content : '');
  const [assignee, setAssignee] = useState(task ? task.assignee : '');
  const [startDate, setStartDate] = useState(task ? task.start_date : '');
  const [endDate, setEndDate] = useState(task ? task.end_date : '');
  const [modalError, setModalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setModalError('Task content cannot be empty.');
      return;
    }
    setModalError('');
    onSave({
      id: task ? task.id : undefined,
      content,
      assignee: assignee || null,
      start_date: startDate || null,
      end_date: endDate || null,
      stage_id: task ? task.stage_id : stageId
    });
  };
  
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try { return new Date(dateString).toISOString().split('T')[0]; } catch (e) { return ''; }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>{task ? 'Edit Task' : 'Create New Task'}</h3>
        {modalError && <div className="alert alert-danger" role="alert">{modalError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="taskContent">Content*:</label>
            <textarea id="taskContent" value={content} onChange={(e) => setContent(e.target.value)} required disabled={isUpdating} rows="3" />
          </div>
          <div className="form-group">
            <label htmlFor="taskAssignee">Assignee:</label>
            <input type="text" id="taskAssignee" value={assignee || ''} onChange={(e) => setAssignee(e.target.value)} disabled={isUpdating} />
          </div>
          <div className="form-group">
            <label htmlFor="taskStartDate">Start Date:</label>
            <input type="date" id="taskStartDate" value={formatDateForInput(startDate)} onChange={(e) => setStartDate(e.target.value)} disabled={isUpdating} />
          </div>
          <div className="form-group">
            <label htmlFor="taskEndDate">End Date:</label>
            <input type="date" id="taskEndDate" value={formatDateForInput(endDate)} onChange={(e) => setEndDate(e.target.value)} disabled={isUpdating} />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={isUpdating}>
              {isUpdating ? (task ? 'Saving...' : 'Creating...') : (task ? 'Save Changes' : 'Create Task')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isUpdating}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

function ProjectBoard() {
  const { projectId } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  const [newStageName, setNewStageName] = useState('');
  const [editingStageId, setEditingStageId] = useState(null);
  const [editingStageName, setEditingStageName] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentStageIdForNewTask, setCurrentStageIdForNewTask] = useState(null);

  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskContent, setEditingSubtaskContent] = useState('');
  const [newSubtaskContentForms, setNewSubtaskContentForms] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});

  const loadProjectDetails = async (showUpdatingIndicator = false) => {
    if (showUpdatingIndicator) setIsUpdating(true); 
    else setLoading(true); 
    setError(null); 
    try {
      const data = await fetchProjectDetails(projectId);
      if (data.stages) {
        data.stages.sort((a, b) => a.order - b.order);
        data.stages.forEach(stage => {
          stage.tasks = stage.tasks ? stage.tasks.sort((a, b) => a.order - b.order) : [];
          stage.tasks.forEach(task => {
            task.subtasks = task.subtasks ? task.subtasks.sort((a,b) => a.order - b.order) : [];
          });
        });
      } else {
        data.stages = [];
      }
      setProjectData(data);
    } catch (err) { setError(err.message || `Failed to fetch project: ${projectId}`);
    } finally { if (showUpdatingIndicator) setIsUpdating(false); else setLoading(false); }
  };

  useEffect(() => { if (projectId) loadProjectDetails(); }, [projectId]);

  const handleCreateStage = async (e) => { e.preventDefault(); if (!newStageName.trim()) { setError('Stage name cannot be empty.'); return; } setIsUpdating(true); setError(null); try { await createStage(projectId, { name: newStageName }); setNewStageName(''); await loadProjectDetails(true); } catch (err) { setError(err.message || 'Failed to create stage.'); setIsUpdating(false); } };
  const handleEditStageName = async (stageId) => { if (!editingStageName.trim()) { setError('Stage name cannot be empty.'); return; } setIsUpdating(true); setError(null); try { await updateStage(stageId, { name: editingStageName }); setEditingStageId(null); setEditingStageName(''); await loadProjectDetails(true); } catch (err) { setError(err.message || `Failed to update stage ${stageId}.`); setIsUpdating(false); } };
  const handleDeleteStage = async (stageId) => { if (window.confirm('Delete this stage? This cannot be undone.')) { setIsUpdating(true); setError(null); try { await deleteStage(stageId); await loadProjectDetails(true); } catch (err) { setError(err.message || `Failed to delete stage ${stageId}.`); setIsUpdating(false); } } };
  const handleMoveStage = async (stageIdToMove, direction) => { setIsUpdating(true); setError(null); const stages = projectData.stages; const currentIndex = stages.findIndex(s => s.id === stageIdToMove); let targetOrder; if (direction === 'left') { if (currentIndex === 0) { setIsUpdating(false); return; } targetOrder = stages[currentIndex - 1].order - 0.001; } else { if (currentIndex === stages.length - 1) { setIsUpdating(false); return; } targetOrder = stages[currentIndex + 1].order + 0.001; } try { await updateStage(stageIdToMove, { order: targetOrder }); await loadProjectDetails(true); } catch (err) { setError(err.message || 'Failed to move stage.'); setIsUpdating(false); } };
  
  const handleOpenTaskModal = (stageId, task = null) => { setEditingTask(task); setCurrentStageIdForNewTask(stageId); setShowTaskModal(true); setError(null); };
  const handleCloseTaskModal = () => { setShowTaskModal(false); setEditingTask(null); setCurrentStageIdForNewTask(null); };
  const handleSaveTask = async (taskData) => { setIsUpdating(true); setError(null); try { if (editingTask && editingTask.id) { await updateTask(editingTask.id, taskData); } else { await createTask(currentStageIdForNewTask, taskData); } handleCloseTaskModal(); await loadProjectDetails(true); } catch (err) { setError(err.message || (editingTask ? 'Failed to update task.' : 'Failed to create task.')); setIsUpdating(false); } };
  const handleDeleteTask = async (taskId) => { if (window.confirm('Delete this task? This cannot be undone.')) { setIsUpdating(true); setError(null); try { await deleteTask(taskId); await loadProjectDetails(true); } catch (err) { setError(err.message || `Failed to delete task ${taskId}.`); setIsUpdating(false); } } };
  const handleMoveTask = async (taskId, currentStageId, direction, targetStageId = null) => { setIsUpdating(true); setError(null); const sourceStage = projectData.stages.find(s => s.id === currentStageId); if (!sourceStage || !sourceStage.tasks) { setError("Src stage error."); setIsUpdating(false); return; } const taskIndex = sourceStage.tasks.findIndex(t => t.id === taskId); let taskDataToUpdate = {}; if (targetStageId && targetStageId !== currentStageId) { const destinationStage = projectData.stages.find(s => s.id === targetStageId); if (!destinationStage || !destinationStage.tasks) { setError("Dest stage error."); setIsUpdating(false); return; } taskDataToUpdate.stage_id = targetStageId; taskDataToUpdate.order = (destinationStage.tasks.length > 0 ? Math.max(...destinationStage.tasks.map(t => t.order)) : -1) + 1; } else { if (direction === 'up') { if (taskIndex === 0) { setIsUpdating(false); return; } taskDataToUpdate.order = sourceStage.tasks[taskIndex - 1].order - 0.001; } else { if (taskIndex === sourceStage.tasks.length - 1) { setIsUpdating(false); return; } taskDataToUpdate.order = sourceStage.tasks[taskIndex + 1].order + 0.001; } } try { await updateTask(taskId, taskDataToUpdate); await loadProjectDetails(true); } catch (err) { setError(err.message || 'Failed to move task.'); setIsUpdating(false); } };

  const toggleShowSubtasks = (taskId) => setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  const handleNewSubtaskContentChange = (parentTaskId, content) => setNewSubtaskContentForms(prev => ({ ...prev, [parentTaskId]: content }));
  const handleCreateSubtask = async (parentTaskId) => { const content = newSubtaskContentForms[parentTaskId]; if (!content || !content.trim()) { setError(`Subtask content for task ${parentTaskId} cannot be empty.`); return; } setIsUpdating(true); setError(null); try { await createSubtask(parentTaskId, { content, completed: false }); setNewSubtaskContentForms(prev => ({ ...prev, [parentTaskId]: '' })); await loadProjectDetails(true); } catch (err) { setError(err.message || 'Failed to create subtask.'); setIsUpdating(false); } };
  const handleToggleSubtaskComplete = async (subtask) => { setIsUpdating(true); setError(null); try { await updateSubtask(subtask.id, { completed: !subtask.completed }); await loadProjectDetails(true); } catch (err) { setError(err.message || 'Failed to update subtask completion.'); setIsUpdating(false); } };
  const handleStartEditSubtask = (subtask) => { setEditingSubtaskId(subtask.id); setEditingSubtaskContent(subtask.content); setError(null); };
  const handleCancelEditSubtask = () => { setEditingSubtaskId(null); setEditingSubtaskContent(''); };
  const handleSaveSubtaskContent = async (subtaskId) => { if (!editingSubtaskContent.trim()) { setError('Subtask content cannot be empty.'); return; } setIsUpdating(true); setError(null); try { await updateSubtask(subtaskId, { content: editingSubtaskContent }); setEditingSubtaskId(null); setEditingSubtaskContent(''); await loadProjectDetails(true); } catch (err) { setError(err.message || `Failed to update subtask ${subtaskId}.`); setIsUpdating(false); } };
  const handleDeleteSubtask = async (subtaskId) => { if (window.confirm('Delete this subtask? This cannot be undone.')) { setIsUpdating(true); setError(null); try { await deleteSubtask(subtaskId); await loadProjectDetails(true); } catch (err) { setError(err.message || `Failed to delete subtask ${subtaskId}.`); setIsUpdating(false); } } };

  if (loading) return <div className="alert alert-info" role="status">Loading project board...</div>;
  if (error && !projectData) return <div className="alert alert-danger" role="alert">Error: {error} <Link to="/" className="btn btn-secondary btn-sm">Back to Projects</Link></div>;
  if (!projectData && !loading) return (<div><p>Project not found or no data available.</p><Link to="/" className="btn btn-secondary btn-sm">Back to Projects</Link></div>);

  const formatDate = (dateString) => { if (!dateString) return 'N/A'; try { return new Date(dateString).toLocaleDateString(); } catch (e) { return 'Invalid Date'; } };

  return (
    <div className="project-board">
      {showTaskModal && (<TaskModal task={editingTask} stageId={currentStageIdForNewTask} onSave={handleSaveTask} onClose={handleCloseTaskModal} isUpdating={isUpdating} />)}
      
      <header className="board-header">
        <h2>{projectData.name}</h2>
        <p>{projectData.description || "No project description."}</p>
        <Link to="/" className="btn btn-light btn-sm">Back to All Projects</Link>
      </header>

      {isUpdating && !showTaskModal && <div className="alert alert-info" role="status">Updating board...</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      
      <div className="add-stage-form form-container">
        <form onSubmit={handleCreateStage}>
          <h3>Add New Stage</h3>
          <div className="form-group">
            <label htmlFor="newStageName">Stage Name:</label>
            <input type="text" id="newStageName" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="Enter stage name" disabled={isUpdating} />
          </div>
          <button type="submit" className="btn btn-success" disabled={isUpdating || !newStageName.trim()}>
            {isUpdating ? 'Adding...' : 'Add Stage'}
          </button>
        </form>
      </div>

      <div className="stages-container">
        {projectData.stages && projectData.stages.length > 0 ? (projectData.stages.map((stage, stageIndex) => (
            <div key={stage.id} className="stage-column">
              <div className="stage-header">
                {editingStageId === stage.id ? 
                  (<input type="text" value={editingStageName} onChange={(e) => setEditingStageName(e.target.value)} onBlur={() => handleEditStageName(stage.id)} onKeyDown={(e) => e.key === 'Enter' && handleEditStageName(stage.id)} autoFocus disabled={isUpdating} />) : 
                  ( <h3 onClick={() => { setEditingStageId(stage.id); setEditingStageName(stage.name); }} title="Edit Stage Name">{stage.name}</h3> )}
                <div className="stage-actions">
                  <button onClick={() => { setEditingStageId(stage.id); setEditingStageName(stage.name); }} className="btn btn-warning btn-sm" disabled={isUpdating} title="Edit Name">✏️</button>
                  <button onClick={() => handleDeleteStage(stage.id)} className="btn btn-danger btn-sm" disabled={isUpdating} title="Delete Stage">🗑️</button>
                  <button onClick={() => handleMoveStage(stage.id, 'left')} className="btn btn-secondary btn-sm" disabled={stageIndex === 0 || isUpdating} title="Move Left">&larr;</button>
                  <button onClick={() => handleMoveStage(stage.id, 'right')} className="btn btn-secondary btn-sm" disabled={stageIndex === projectData.stages.length - 1 || isUpdating} title="Move Right">&rarr;</button>
                </div>
              </div>
              <div className="tasks-list">
                {stage.tasks && stage.tasks.length > 0 ? (stage.tasks.map((task, taskIndex) => (
                    <div key={task.id} className="task-card">
                      <div className="task-content">
                        <p><strong>{task.content}</strong></p>
                        {task.assignee && <p className="task-detail">Assignee: {task.assignee}</p>}
                        {task.start_date && <p className="task-detail">Start: {formatDate(task.start_date)}</p>}
                        {task.end_date && <p className="task-detail">End: {formatDate(task.end_date)}</p>}
                      </div>
                      <div className="subtasks-section">
                        <button onClick={() => toggleShowSubtasks(task.id)} className="btn btn-light btn-sm toggle-subtasks-button" disabled={isUpdating}>
                          {expandedTasks[task.id] ? 'Hide' : 'Show'} Subtasks ({task.subtasks ? task.subtasks.length : 0})
                        </button>
                        {expandedTasks[task.id] && (
                          <ul className="subtask-list list-unstyled">
                            {task.subtasks && task.subtasks.map(subtask => (
                              <li key={subtask.id} className={`subtask-item ${subtask.completed ? 'completed' : ''}`}>
                                <input type="checkbox" checked={subtask.completed} onChange={() => handleToggleSubtaskComplete(subtask)} disabled={isUpdating} />
                                {editingSubtaskId === subtask.id ? 
                                  (<input type="text" value={editingSubtaskContent} onChange={(e) => setEditingSubtaskContent(e.target.value)} onBlur={() => handleSaveSubtaskContent(subtask.id)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSubtaskContent(subtask.id); if (e.key === 'Escape') handleCancelEditSubtask(); }} autoFocus disabled={isUpdating} className="subtask-edit-input" />) : 
                                  (<span onClick={() => handleStartEditSubtask(subtask)} className="subtask-content-text">{subtask.content}</span>)}
                                <div className="subtask-actions">
                                  <button onClick={() => handleStartEditSubtask(subtask)} className="btn btn-warning btn-sm" disabled={isUpdating} title="Edit Subtask">✏️</button>
                                  <button onClick={() => handleDeleteSubtask(subtask.id)} className="btn btn-danger btn-sm" disabled={isUpdating} title="Delete Subtask">🗑️</button>
                                </div>
                              </li>))}
                            <li className="add-subtask-form-container form-group">
                              <input type="text" placeholder="New subtask..." value={newSubtaskContentForms[task.id] || ''} onChange={(e) => handleNewSubtaskContentChange(task.id, e.target.value)} disabled={isUpdating} className="add-subtask-input" />
                              <button onClick={() => handleCreateSubtask(task.id)} className="btn btn-success btn-sm add-subtask-submit-button" disabled={isUpdating || !(newSubtaskContentForms[task.id] || '').trim()}>Add</button>
                            </li>
                          </ul>)}
                      </div>
                      <div className="task-actions">
                        <button onClick={() => handleOpenTaskModal(stage.id, task)} className="btn btn-warning btn-sm edit-task-button" disabled={isUpdating} title="Edit Task">✏️</button>
                        <button onClick={() => handleDeleteTask(task.id)} className="btn btn-danger btn-sm delete-task-button" disabled={isUpdating} title="Delete Task">🗑️</button>
                        <button onClick={() => handleMoveTask(task.id, stage.id, 'up')} className="btn btn-secondary btn-sm" disabled={taskIndex === 0 || isUpdating} title="Move Up">&uarr;</button>
                        <button onClick={() => handleMoveTask(task.id, stage.id, 'down')} className="btn btn-secondary btn-sm" disabled={taskIndex === stage.tasks.length - 1 || isUpdating} title="Move Down">&darr;</button>
                        {projectData.stages.filter(s => s.id !== stage.id).map(otherStage => (<button key={otherStage.id} onClick={() => handleMoveTask(task.id, stage.id, 'move', otherStage.id)} className="btn btn-secondary btn-sm move-to-stage-button" disabled={isUpdating} title={`Move to ${otherStage.name}`}>&rarr; {otherStage.name.substring(0,3)}..</button>))}
                      </div>
                    </div>
                  ))
                ) : ( <p className="no-tasks-message">No tasks here.</p> )}
                <button className="btn btn-success btn-sm add-task-button" onClick={() => handleOpenTaskModal(stage.id, null)} disabled={isUpdating}>+ Add Task</button>
              </div>
            </div>
          ))
        ) : ( <p className="alert alert-info">No stages defined. Add one using the form above.</p> )}
      </div>
    </div>
  );
}

export default ProjectBoard;
