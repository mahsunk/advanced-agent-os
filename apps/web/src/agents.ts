export type DashboardAgent = {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
};

export const dashboardAgents: DashboardAgent[] = [
  { id: 'pm', name: 'Project Manager Agent', role: 'Planning', status: 'idle' },
  { id: 'architect', name: 'Architect Agent', role: 'Architecture', status: 'idle' },
  { id: 'frontend', name: 'Frontend Agent', role: 'UI Engineering', status: 'idle' },
  { id: 'backend', name: 'Backend Agent', role: 'API Engineering', status: 'idle' },
  { id: 'qa', name: 'QA Agent', role: 'Testing', status: 'idle' },
  { id: 'security', name: 'Security Agent', role: 'Risk Review', status: 'idle' },
  { id: 'devops', name: 'DevOps Agent', role: 'Deployment', status: 'idle' },
  { id: 'research', name: 'Research Agent', role: 'Technical Research', status: 'idle' },
  { id: 'docs', name: 'Docs Agent', role: 'Documentation', status: 'idle' },
  { id: 'reviewer', name: 'Reviewer Agent', role: 'Final Review', status: 'idle' }
];
