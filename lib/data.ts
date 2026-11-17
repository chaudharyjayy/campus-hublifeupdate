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

export type LostFoundItem = { id: string; kind: 'Lost' | 'Found'; item: string; where: string; date: string };
export const lostFoundItems: LostFoundItem[] = [
  { id: 'lf1', kind: 'Found', item: 'Set of keys', where: 'Library, room 2', date: '17 Nov' },
  { id: 'lf2', kind: 'Lost', item: 'Black project notebook', where: 'Seminar hall', date: '16 Nov' },
  { id: 'lf3', kind: 'Found', item: 'Blue water bottle', where: 'Cafeteria', date: '14 Nov' },
  { id: 'lf4', kind: 'Lost', item: 'Carding ID card', where: 'Innovation Lab', date: '13 Nov' },
];
