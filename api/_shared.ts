interface Task {
  id: number;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  importanceScore: number;
  status: string;
  owner: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const now = new Date().toISOString();

export const tasks: Task[] = [
  { id: 1, title: 'Fix production server crash', description: 'Critical: API returning 500 errors on /checkout endpoint', startDate: daysFromNow(-12), dueDate: daysFromNow(-1), importanceScore: 95, status: 'In Progress', owner: 'Alice', category: 'Engineering', createdAt: now, updatedAt: now },
  { id: 2, title: 'Submit quarterly compliance report', description: 'SEC filing deadline approaching', startDate: daysFromNow(-20), dueDate: daysFromNow(1), importanceScore: 90, status: 'In Progress', owner: 'Bob', category: 'Legal', createdAt: now, updatedAt: now },
  { id: 3, title: 'Patch security vulnerability', description: 'CVE-2026-1234 affecting auth module', startDate: daysFromNow(-5), dueDate: daysFromNow(2), importanceScore: 98, status: 'In Progress', owner: 'Charlie', category: 'Security', createdAt: now, updatedAt: now },
  { id: 4, title: 'Prepare board presentation', description: 'Q3 results and Q4 strategy for board meeting', startDate: daysFromNow(-8), dueDate: daysFromNow(1), importanceScore: 85, status: 'In Progress', owner: 'Alice', category: 'Management', createdAt: now, updatedAt: now },
  { id: 5, title: 'Design new microservice architecture', description: 'Plan migration from monolith to microservices', startDate: daysFromNow(-2), dueDate: daysFromNow(25), importanceScore: 88, status: 'Not Started', owner: 'Charlie', category: 'Engineering', createdAt: now, updatedAt: now },
  { id: 6, title: 'Hire senior backend developer', description: 'Team needs scaling, 3 candidates in pipeline', startDate: daysFromNow(0), dueDate: daysFromNow(30), importanceScore: 80, status: 'In Progress', owner: 'Diana', category: 'HR', createdAt: now, updatedAt: now },
  { id: 7, title: 'Implement CI/CD pipeline', description: 'Automate testing and deployment workflow', startDate: daysFromNow(-1), dueDate: daysFromNow(20), importanceScore: 75, status: 'Not Started', owner: 'Eve', category: 'DevOps', createdAt: now, updatedAt: now },
  { id: 8, title: 'Create disaster recovery plan', description: 'Document and test backup/restore procedures', startDate: daysFromNow(0), dueDate: daysFromNow(35), importanceScore: 82, status: 'Not Started', owner: 'Bob', category: 'Operations', createdAt: now, updatedAt: now },
  { id: 9, title: 'Develop mobile app MVP', description: 'React Native app for core features', startDate: daysFromNow(-3), dueDate: daysFromNow(40), importanceScore: 78, status: 'In Progress', owner: 'Frank', category: 'Product', createdAt: now, updatedAt: now },
  { id: 10, title: 'Update company website footer', description: 'Copyright year and new office address', startDate: daysFromNow(-10), dueDate: daysFromNow(0), importanceScore: 25, status: 'Not Started', owner: 'Eve', category: 'Marketing', createdAt: now, updatedAt: now },
  { id: 11, title: 'Process expense reports', description: 'July expense reimbursements pending', startDate: daysFromNow(-14), dueDate: daysFromNow(-2), importanceScore: 35, status: 'Not Started', owner: 'Diana', category: 'Finance', createdAt: now, updatedAt: now },
  { id: 12, title: 'Fix email signature template', description: 'Logo not displaying correctly in Outlook', startDate: daysFromNow(-7), dueDate: daysFromNow(1), importanceScore: 20, status: 'On Hold', owner: 'Frank', category: 'IT', createdAt: now, updatedAt: now },
  { id: 13, title: 'Order office supplies', description: 'Printer paper, toner, sticky notes running low', startDate: daysFromNow(-6), dueDate: daysFromNow(0), importanceScore: 30, status: 'Not Started', owner: 'Diana', category: 'Operations', createdAt: now, updatedAt: now },
  { id: 14, title: 'Reorganize shared drive folders', description: 'Cleanup old project folders and naming conventions', startDate: daysFromNow(0), dueDate: daysFromNow(45), importanceScore: 15, status: 'Not Started', owner: 'Eve', category: 'IT', createdAt: now, updatedAt: now },
  { id: 15, title: 'Research new coffee machine', description: 'Current one is slow, team wants an upgrade', startDate: daysFromNow(0), dueDate: daysFromNow(60), importanceScore: 10, status: 'Not Started', owner: 'Frank', category: 'Facilities', createdAt: now, updatedAt: now },
  { id: 16, title: 'Update internal wiki theme', description: 'Confluence theme looks outdated', startDate: daysFromNow(-1), dueDate: daysFromNow(50), importanceScore: 12, status: 'Not Started', owner: 'Charlie', category: 'IT', createdAt: now, updatedAt: now },
  { id: 17, title: 'Plan team building event', description: 'Quarterly social event for engineering team', startDate: daysFromNow(2), dueDate: daysFromNow(30), importanceScore: 40, status: 'Not Started', owner: 'Diana', category: 'HR', createdAt: now, updatedAt: now },
  { id: 18, title: 'Write blog post about tech stack', description: 'Share our architecture decisions on company blog', startDate: daysFromNow(0), dueDate: daysFromNow(21), importanceScore: 30, status: 'Not Started', owner: 'Alice', category: 'Marketing', createdAt: now, updatedAt: now },
  { id: 19, title: 'Prepare budget proposal', description: 'FY2027 engineering budget with headcount projections', startDate: daysFromNow(-3), dueDate: daysFromNow(10), importanceScore: 82, status: 'In Progress', owner: 'Alice', category: 'Finance', createdAt: now, updatedAt: now },
  { id: 20, title: 'Database migration to v3', description: 'Upgrade PostgreSQL and migrate schemas', startDate: daysFromNow(-1), dueDate: daysFromNow(14), importanceScore: 72, status: 'Not Started', owner: 'Charlie', category: 'Engineering', createdAt: now, updatedAt: now },
];

export let nextId = 21;

export function computeFields(task: Task) {
  const today = new Date();
  const start = new Date(task.startDate);
  const due = new Date(task.dueDate);
  const taskDuration = due.getTime() - start.getTime();
  const elapsed = today.getTime() - start.getTime();
  const timelineProgress = taskDuration <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((elapsed / taskDuration) * 10000) / 100));
  const priorityScore = Math.round((task.importanceScore * 0.6 + timelineProgress * 0.4) * 100) / 100;
  const highImportance = task.importanceScore >= 72;
  const highUrgency = timelineProgress >= 70;
  const quadrant = highImportance && highUrgency ? 'Do' : highImportance ? 'Schedule' : highUrgency ? 'Delegate' : 'Delete';
  const dueEnd = new Date(due);
  dueEnd.setHours(23, 59, 59, 999);

  return {
    ...task,
    today: today.toISOString().split('T')[0],
    timelineProgress,
    x: timelineProgress,
    y: task.importanceScore,
    priorityScore,
    quadrant,
    isOverdue: today > dueEnd,
  };
}

export function setCors(res: { setHeader: (k: string, v: string) => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
