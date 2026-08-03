import sequelize from './database';
import Task from './models/task';

const today = new Date();
function daysFromNow(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const seedTasks = [
  // DO quadrant (high importance, high urgency)
  { title: 'Fix production server crash', description: 'Critical: API returning 500 errors on /checkout endpoint', startDate: daysFromNow(-12), dueDate: daysFromNow(-1), importanceScore: 95, status: 'In Progress' as const, owner: 'Alice', category: 'Engineering' },
  { title: 'Submit quarterly compliance report', description: 'SEC filing deadline approaching', startDate: daysFromNow(-20), dueDate: daysFromNow(1), importanceScore: 90, status: 'In Progress' as const, owner: 'Bob', category: 'Legal' },
  { title: 'Patch security vulnerability', description: 'CVE-2026-1234 affecting auth module', startDate: daysFromNow(-5), dueDate: daysFromNow(2), importanceScore: 98, status: 'In Progress' as const, owner: 'Charlie', category: 'Security' },
  { title: 'Prepare board presentation', description: 'Q3 results and Q4 strategy for board meeting', startDate: daysFromNow(-8), dueDate: daysFromNow(1), importanceScore: 85, status: 'In Progress' as const, owner: 'Alice', category: 'Management' },

  // SCHEDULE quadrant (high importance, low urgency)
  { title: 'Design new microservice architecture', description: 'Plan migration from monolith to microservices', startDate: daysFromNow(-2), dueDate: daysFromNow(25), importanceScore: 88, status: 'Not Started' as const, owner: 'Charlie', category: 'Engineering' },
  { title: 'Hire senior backend developer', description: 'Team needs scaling, 3 candidates in pipeline', startDate: daysFromNow(0), dueDate: daysFromNow(30), importanceScore: 80, status: 'In Progress' as const, owner: 'Diana', category: 'HR' },
  { title: 'Implement CI/CD pipeline', description: 'Automate testing and deployment workflow', startDate: daysFromNow(-1), dueDate: daysFromNow(20), importanceScore: 75, status: 'Not Started' as const, owner: 'Eve', category: 'DevOps' },
  { title: 'Create disaster recovery plan', description: 'Document and test backup/restore procedures', startDate: daysFromNow(0), dueDate: daysFromNow(35), importanceScore: 82, status: 'Not Started' as const, owner: 'Bob', category: 'Operations' },
  { title: 'Develop mobile app MVP', description: 'React Native app for core features', startDate: daysFromNow(-3), dueDate: daysFromNow(40), importanceScore: 78, status: 'In Progress' as const, owner: 'Frank', category: 'Product' },

  // DELEGATE quadrant (low importance, high urgency)
  { title: 'Update company website footer', description: 'Copyright year and new office address', startDate: daysFromNow(-10), dueDate: daysFromNow(0), importanceScore: 25, status: 'Not Started' as const, owner: 'Eve', category: 'Marketing' },
  { title: 'Process expense reports', description: 'July expense reimbursements pending', startDate: daysFromNow(-14), dueDate: daysFromNow(-2), importanceScore: 35, status: 'Not Started' as const, owner: 'Diana', category: 'Finance' },
  { title: 'Fix email signature template', description: 'Logo not displaying correctly in Outlook', startDate: daysFromNow(-7), dueDate: daysFromNow(1), importanceScore: 20, status: 'On Hold' as const, owner: 'Frank', category: 'IT' },
  { title: 'Order office supplies', description: 'Printer paper, toner, sticky notes running low', startDate: daysFromNow(-6), dueDate: daysFromNow(0), importanceScore: 30, status: 'Not Started' as const, owner: 'Diana', category: 'Operations' },

  // DELETE quadrant (low importance, low urgency)
  { title: 'Reorganize shared drive folders', description: 'Cleanup old project folders and naming conventions', startDate: daysFromNow(0), dueDate: daysFromNow(45), importanceScore: 15, status: 'Not Started' as const, owner: 'Eve', category: 'IT' },
  { title: 'Research new coffee machine', description: 'Current one is slow, team wants an upgrade', startDate: daysFromNow(0), dueDate: daysFromNow(60), importanceScore: 10, status: 'Not Started' as const, owner: 'Frank', category: 'Facilities' },
  { title: 'Update internal wiki theme', description: 'Confluence theme looks outdated', startDate: daysFromNow(-1), dueDate: daysFromNow(50), importanceScore: 12, status: 'Not Started' as const, owner: 'Charlie', category: 'IT' },
  { title: 'Plan team building event', description: 'Quarterly social event for engineering team', startDate: daysFromNow(2), dueDate: daysFromNow(30), importanceScore: 40, status: 'Not Started' as const, owner: 'Diana', category: 'HR' },
  { title: 'Write blog post about tech stack', description: 'Share our architecture decisions on company blog', startDate: daysFromNow(0), dueDate: daysFromNow(21), importanceScore: 30, status: 'Not Started' as const, owner: 'Alice', category: 'Marketing' },

  // Edge cases
  { title: 'Prepare budget proposal', description: 'FY2027 engineering budget with headcount projections', startDate: daysFromNow(-3), dueDate: daysFromNow(10), importanceScore: 82, status: 'In Progress' as const, owner: 'Alice', category: 'Finance' },
  { title: 'Database migration to v3', description: 'Upgrade PostgreSQL and migrate schemas', startDate: daysFromNow(-1), dueDate: daysFromNow(14), importanceScore: 72, status: 'Not Started' as const, owner: 'Charlie', category: 'Engineering' },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');
    await sequelize.sync({ force: true });
    console.log('Tables created.');
    await Task.bulkCreate(seedTasks);
    console.log(`Seeded ${seedTasks.length} tasks.`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
