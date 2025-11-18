// src/data/sampleApplications.js

export const STATUS_OPTIONS = [
  'Saved',
  'Applied',
  'OA',
  'Interview',
  'Offer',
  'Rejected',
];

export const ROLE_TYPES = ['Internship', 'Full-time'];

export const sampleApplications = [
  {
    id: 1,
    company_name: 'Google',
    role_title: 'Software Engineering Intern',
    role_type: 'Internship',
    status: 'Interview',
    location: 'New York, NY (Hybrid)',
    job_link: 'https://careers.google.com/jobs/...intern...',
    applied_date: '2025-01-15',
    next_interview_date: '2025-02-10',
    notes: [
      {
        id: 101,
        content: 'Met recruiter at school career fair, referred to SWE intern role.',
        created_at: '2025-01-16 14:20',
      },
      {
        id: 102,
        content: 'Phone screen scheduled for Feb 10 with Kevin (SWE).',
        created_at: '2025-01-25 09:05',
      },
    ],
  },
  {
    id: 2,
    company_name: 'Microsoft',
    role_title: 'Cloud Support Intern',
    role_type: 'Internship',
    status: 'Applied',
    location: 'Remote (US)',
    job_link: 'https://careers.microsoft.com/students/us/en/job/...',
    applied_date: '2025-01-20',
    next_interview_date: '',
    notes: [
      {
        id: 201,
        content: 'Submitted via Handshake. Used resume v3 (cloud-focused).',
        created_at: '2025-01-20 18:12',
      },
    ],
  },
  {
    id: 3,
    company_name: 'Goldman Sachs',
    role_title: 'Technology Analyst',
    role_type: 'Full-time',
    status: 'OA',
    location: 'Jersey City, NJ',
    job_link: 'https://goldmansachs.wd1.myworkdayjobs.com/...',
    applied_date: '2024-12-05',
    next_interview_date: '',
    notes: [
      {
        id: 301,
        content: 'Online assessment link received, due next Friday.',
        created_at: '2024-12-07 11:32',
      },
    ],
  },
];
