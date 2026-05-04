import { dashboardAgents } from '../agents';

export type DashboardState = {
  agents: typeof dashboardAgents;
  selectedAgentId?: string;
};

export const dashboardState: DashboardState = {
  agents: dashboardAgents,
  selectedAgentId: undefined
};
