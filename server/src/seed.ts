import { supabase } from './database';

const today = new Date();
function daysFromNow(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const seedTasks = [
  // DO quadrant (high importance, high urgency)
  { title: 'Fix production server crash', description: 'Critical: API returning 500 errors on /checkout endpoint', start_date: daysFromNow(-12), due_date: daysFromNow(-1), importance_score: 95, status: 'In Progress', owner: 'Alice', category: 'Engineering' },
  { title: 'Submit quarterly compliance report', description: 'SEC filing deadline approaching', start_date: daysFromNow(-20), due_date: daysFromNow(1), importance_score: 90, status: 'In Progress', owner: 'Bob', category: 'Legal' },
  { title: 'Patch security vulnerability', description: 'CVE-2026-1234 affecting auth module', start_date: daysFromNow(-5), due_date: daysFromNow(2), importance_score: 98, status: 'In Progress', owner: 'Charlie', category: 'Security' },
  { title: 'Prepare board presentation', description: 'Q3 results and Q4 strategy for board meeting', start_date: daysFromNow(-8), due_date: daysFromNow(1), importance_score: 85, status: 'In Progress', owner: 'Alice', category: 'Management' },

  // SCHEDULE quadrant (high importance, low urgency)
  { title: 'Design new microservice architecture', description: 'Plan migration from monolith to microservices', start_date: daysFromNow(-2), due_date: daysFromNow(25), importance_score: 88, status: 'Not Started', owner: 'Charlie', category: 'Engineering' },
  { title: 'Hire senior backend developer', description: 'Team needs scaling, 3 candidates in pipeline', start_date: daysFromNow(0), due_date: daysFromNow(30), importance_score: 80, status: 'In Progress', owner: 'Diana', category: 'HR' },
  { title: 'Implement CI/CD pipeline', description: 'Automate testing and deployment workflow', start_date: daysFromNow(-1), due_date: daysFromNow(20), importance_score: 75, status: 'Not Started', owner: 'Eve', category: 'DevOps' },
  { title: 'Create disaster recovery plan', description: 'Document and test backup/restore procedures', start_date: daysFromNow(0), due_date: daysFromNow(35), importance_score: 82, status: 'Not Started', owner: 'Bob', category: 'Operations' },
  { title: 'Develop mobile app MVP', description: 'React Native app for core features', start_date: daysFromNow(-3), due_date: daysFromNow(40), importance_score: 78, status: 'In Progress', owner: 'Frank', category: 'Product' },

  // DELEGATE quadrant (low importance, high urgency)
  { title: 'Update company website footer', description: 'Copyright year and new office address', start_date: daysFromNow(-10), due_date: daysFromNow(0), importance_score: 25, status: 'Not Started', owner: 'Eve', category: 'Marketing' },
  { title: 'Process expense reports', description: 'July expense reimbursements pending', start_date: daysFromNow(-14), due_date: daysFromNow(-2), importance_score: 35, status: 'Not Started', owner: 'Diana', category: 'Finance' },
  { title: 'Fix email signature template', description: 'Logo not displaying correctly in Outlook', start_date: daysFromNow(-7), due_date: daysFromNow(1), importance_score: 20, status: 'On Hold', owner: 'Frank', category: 'IT' },
  { title: 'Order office supplies', description: 'Printer paper, toner, sticky notes running low', start_date: daysFromNow(-6), due_date: daysFromNow(0), importance_score: 30, status: 'Not Started', owner: 'Diana', category: 'Operations' },

  // DEPRIORITIZE quadrant (low importance, low urgency)
  { title: 'Reorganize shared drive folders', description: 'Cleanup old project folders and naming conventions', start_date: daysFromNow(0), due_date: daysFromNow(45), importance_score: 15, status: 'Not Started', owner: 'Eve', category: 'IT' },
  { title: 'Research new coffee machine', description: 'Current one is slow, team wants an upgrade', start_date: daysFromNow(0), due_date: daysFromNow(60), importance_score: 10, status: 'Not Started', owner: 'Frank', category: 'Facilities' },
  { title: 'Update internal wiki theme', description: 'Confluence theme looks outdated', start_date: daysFromNow(-1), due_date: daysFromNow(50), importance_score: 12, status: 'Not Started', owner: 'Charlie', category: 'IT' },
  { title: 'Plan team building event', description: 'Quarterly social event for engineering team', start_date: daysFromNow(2), due_date: daysFromNow(30), importance_score: 40, status: 'Not Started', owner: 'Diana', category: 'HR' },
  { title: 'Write blog post about tech stack', description: 'Share our architecture decisions on company blog', start_date: daysFromNow(0), due_date: daysFromNow(21), importance_score: 30, status: 'Not Started', owner: 'Alice', category: 'Marketing' },

  // Edge cases
  { title: 'Prepare budget proposal', description: 'FY2027 engineering budget with headcount projections', start_date: daysFromNow(-3), due_date: daysFromNow(10), importance_score: 82, status: 'In Progress', owner: 'Alice', category: 'Finance' },
  { title: 'Database migration to v3', description: 'Upgrade PostgreSQL and migrate schemas', start_date: daysFromNow(-1), due_date: daysFromNow(14), importance_score: 72, status: 'Not Started', owner: 'Charlie', category: 'Engineering' },
];

async function seed() {
  try {
    // Clear existing tasks
    const { error: delError } = await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) throw delError;
    console.log('Cleared existing tasks.');

    // Insert seed tasks
    const { error: insError } = await supabase.from('tasks').insert(seedTasks);
    if (insError) throw insError;
    console.log(`Seeded ${seedTasks.length} tasks.`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
