/* CampusHub — upGrad SOT Pune. Sample student data (fictional). */

export type Student = {
  id: string;
  name: string;
  handle: string;
  branch: string;
  year: string;
  bio: string;
  skills: string[];
  lookingForTeam: boolean;
  profileCompleteness: number;
};

export const students: Student[] = [
  { id: 'aarav', name: 'Aarav Patil', handle: 'aaravp', branch: 'CSE', year: '3rd year', bio: 'Full-stack dev who likes shipping small tools fast. Looking for an ML person for Campus Hackathon 2026.', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Figma'], lookingForTeam: true, profileCompleteness: 80 },
  { id: 'sneha', name: 'Sneha Kulkarni', handle: 'snehak', branch: 'AI & DS', year: '2nd year', bio: 'ML and data pipelines.', skills: ['Python', 'ML', 'Pandas'], lookingForTeam: true, profileCompleteness: 70 },
  { id: 'rohan', name: 'Rohan Deshmukh', handle: 'rohand', branch: 'CSE', year: '4th year', bio: 'Infra and backend.', skills: ['Go', 'Docker', 'Kubernetes'], lookingForTeam: false, profileCompleteness: 90 },
  { id: 'isha', name: 'Isha Joshi', handle: 'ishaj', branch: 'IT', year: '2nd year', bio: 'Product design and prototyping.', skills: ['Figma', 'UI/UX', 'Webflow'], lookingForTeam: false, profileCompleteness: 85 },
  { id: 'kabir', name: 'Kabir Shaikh', handle: 'kabirs', branch: 'CSE', year: '3rd year', bio: 'Mobile apps with Flutter.', skills: ['Flutter', 'Firebase', 'Dart'], lookingForTeam: true, profileCompleteness: 60 },
  { id: 'meera', name: 'Meera Nair', handle: 'meeran', branch: 'AI & DS', year: '3rd year', bio: 'Open-source contributor, Go + WASI.', skills: ['Go', 'C++', 'Rust'], lookingForTeam: true, profileCompleteness: 75 },
];

export type CampusEvent = {
  id: string;
  title: string;
  type: 'event' | 'hackathon';
  category: string;
  venue: string;
  start: string;
  registrationDeadline: string;
  capacity?: number;
};

export const campusEvents: CampusEvent[] = [
  { id: 'freshers-talk', title: "Freshers' tech talk", type: 'event', category: 'Meetup', venue: 'SOT seminar hall', start: '2026-11-18', registrationDeadline: '2026-11-16', capacity: 120 },
  { id: 'smart-campus-ideathon', title: 'Smart campus ideathon', type: 'hackathon', category: 'Hackathon', venue: 'SOT seminar hall', start: '2026-11-24', registrationDeadline: '2026-11-22', capacity: 60 },
  { id: 'git-workshop', title: 'Intro to Git & GitHub', type: 'event', category: 'Workshop', venue: 'SOT seminar hall', start: '2026-11-25', registrationDeadline: '2026-11-24', capacity: 40 },
  { id: 'design-jam', title: 'UI/UX Design Jam', type: 'event', category: 'Design jam', venue: 'Innovation Lab', start: '2026-12-02', registrationDeadline: '2026-11-30', capacity: 30 },
  { id: 'campus-hackathon', title: 'Campus Hackathon 2026', type: 'hackathon', category: 'Hackathon', venue: 'Main Auditorium', start: '2026-12-05', registrationDeadline: '2026-12-03', capacity: 100 },
];

export type CommunityPost = { id: string; author: string; title: string; replies: number; tag: string };
export const communityPosts: CommunityPost[] = [
  { id: 'p1', author: 'Kabir Shaikh', title: 'Need a backend dev for Campus Hackathon 2026', replies: 6, tag: 'Find teammate' },
  { id: 'p2', author: 'Sneha Kulkarni', title: 'Firebase auth keeps logging me out on refresh', replies: 3, tag: 'Need help' },
  { id: 'p3', author: 'Aarav Patil', title: 'Which electives are best for an ML track?', replies: 9, tag: 'Ask' },
];

export type LostFoundItem = { id: string; kind: 'Lost' | 'Found'; item: string; where: string; date: string };
export const lostFoundItems: LostFoundItem[] = [
  { id: 'lf1', kind: 'Found', item: 'Set of keys', where: 'Library, room 2', date: '17 Nov' },
  { id: 'lf2', kind: 'Lost', item: 'Black project notebook', where: 'Seminar hall', date: '16 Nov' },
  { id: 'lf3', kind: 'Found', item: 'Blue water bottle', where: 'Cafeteria', date: '14 Nov' },
  { id: 'lf4', kind: 'Lost', item: 'Carding ID card', where: 'Innovation Lab', date: '13 Nov' },
];
