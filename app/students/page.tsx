import Link from 'next/link';
import { students } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'People',
  description: 'Find classmates and teammates around upGrad SOT Pune.',
};

export default function StudentsPage() {
  return (
    <>
      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <div className="container">
          <p className="kicker">People</p>
          <h1>Find a teammate.</h1>
          <p className="sub">Classmates and project teammates around campus. Skills, year, and whether they&rsquo;re looking.</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="grid">
            {students.map((student) => (
              <Link key={student.id} href={`/students/${student.id}`} className="card" style={{ textDecoration: 'none' }}>
                <p className="card__eyebrow">{student.branch} · {student.year}</p>
                <h3>{student.name}</h3>
                <p>{student.skills.slice(0, 4).join(' · ')}</p>
                <p className="mono" style={{ marginTop: '0.25rem' }}>Profile completeness: {student.profileCompleteness}%</p>
                {student.lookingForTeam && <span className="tag" style={{ background: 'var(--green)', color: 'var(--paper)', width: 'max-content' }}>Looking for a team</span>}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
