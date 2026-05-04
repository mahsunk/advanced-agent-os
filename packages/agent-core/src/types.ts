export type AgentRole =
  | "project-manager"
  | "architect"
  | "frontend"
  | "backend"
  | "qa"
  | "devops"
  | "security"
  | "research"
  | "reviewer"
  | "docs";

export type AgentTask = {
  id: string;
  title: string;
  goal: string;
  role: AgentRole;
  context?: Record<string, unknown>;
};

export type AgentResult = {
  taskId: string;
  agent: string;
  summary: string;
  artifacts: Array<{
    type: "plan" | "code" | "test" | "report" | "doc";
    name: string;
    content: string;
  }>;
  nextTasks?: AgentTask[];
};

export type Agent = {
  id: string;
  role: AgentRole;
  description: string;
  run(task: AgentTask): Promise<AgentResult>;
};
