// frontend/src/services/api.js

export const fetchProjects = async () => {
  try {
    const response = await fetch('/api/projects');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error; // Re-throw to allow component to handle
  }
};

export const fetchHello = async () => {
  try {
    const response = await fetch('/hello'); // Direct path as per backend spec
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text(); // Expecting plain text response
  } catch (error) {
    console.error("Error fetching /hello:", error);
    throw error;
  }
};
export const createSubtask = async (parentTaskId, subtaskData) => {
  try {
    const response = await fetch(`/api/tasks/${parentTaskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subtaskData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to create subtask'}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error creating subtask for task ${parentTaskId}:`, error);
    throw error;
  }
};

export const updateSubtask = async (subtaskId, subtaskData) => {
  try {
    const response = await fetch(`/api/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subtaskData), // e.g., { content, completed, order }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to update subtask'}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating subtask ${subtaskId}:`, error);
    throw error;
  }
};

export const deleteSubtask = async (subtaskId) => {
  try {
    const response = await fetch(`/api/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `${errorMessage} - ${errorData.message || 'Failed to delete subtask'}`;
      } catch (e) {
        if (response.statusText) {
          errorMessage = `${errorMessage} - ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }
    if (response.status === 204) { // No Content
      return { success: true, message: 'Subtask deleted successfully' };
    }
    return await response.json().catch(() => ({ success: true, message: 'Subtask deleted successfully (no JSON body)' }));
  } catch (error) {
    console.error(`Error deleting subtask ${subtaskId}:`, error);
    throw error;
  }
};

export const createProject = async (projectData) => {
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    if (!response.ok) {
      // Handle specific errors like 409 Conflict or validation errors
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const fetchProjectDetails = async (projectId) => {
  try {
    const response = await fetch(`/api/projects/${projectId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Project not found'}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching project details for ${projectId}:`, error);
    throw error;
  }
};

export const createStage = async (projectId, stageData) => {
  try {
    const response = await fetch(`/api/projects/${projectId}/stages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stageData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to create stage'}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error creating stage for project ${projectId}:`, error);
    throw error;
  }
};

export const updateStage = async (stageId, stageData) => {
  try {
    const response = await fetch(`/api/stages/${stageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageData), // Can include { name, order }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to update stage'}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating stage ${stageId}:`, error);
    throw error;
  }
};

export const deleteStage = async (stageId) => {
  try {
    const response = await fetch(`/api/stages/${stageId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      // Handle cases where the response might not be JSON (e.g., 404, 500 without JSON body)
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `${errorMessage} - ${errorData.message || 'Failed to delete stage'}`;
      } catch (e) {
        // Response was not JSON or error parsing JSON
        if (response.statusText) {
          errorMessage = `${errorMessage} - ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }
    // For DELETE, often there's no body or a 204 No Content response.
    // If a specific success message or data is returned, parse it.
    // Otherwise, return a generic success indicator.
    if (response.status === 204) {
      return { success: true, message: 'Stage deleted successfully' };
    }
    // Try to parse JSON if status is 200 or similar and there might be a body
    // This depends on your API's behavior for DELETE success
    return await response.json().catch(() => ({ success: true, message: 'Stage deleted successfully (no JSON body)' }));
  } catch (error) {
    console.error(`Error deleting stage ${stageId}:`, error);
    throw error;
  }
};

export const createTask = async (stageId, taskData) => {
  try {
    const response = await fetch(`/api/stages/${stageId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to create task'}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error creating task for stage ${stageId}:`, error);
    throw error;
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData), // e.g., { content, assignee, start_date, end_date, order, stage_id }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Failed to update task'}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `${errorMessage} - ${errorData.message || 'Failed to delete task'}`;
      } catch (e) {
        if (response.statusText) {
          errorMessage = `${errorMessage} - ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }
    if (response.status === 204) { // No Content
      return { success: true, message: 'Task deleted successfully' };
    }
    return await response.json().catch(() => ({ success: true, message: 'Task deleted successfully (no JSON body)' }));
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // DELETE might not return a body or might return a confirmation
    // If it returns a body, and it's JSON: return await response.json();
    // Otherwise, if no body or non-JSON:
    return { success: true, message: 'Project deleted successfully' }; 
  } catch (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    throw error;
  }
};
