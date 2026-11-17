import Link from 'next/link';
import { notFound } from 'next/navigation';
import { students } from '@/lib/data';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return students.map((student) => ({ id: student.id }));
}

export const dynamicParams = false;

type Segment = { id: string };

export async function generateMetadata({ params }: { params: Promise<Segment> }): Promise<Metadata> {
  const { id } = await params;
  const student = students.find((entry) => entry.id === id);
  return { title: student ? student.name : 'People', description: student?.bio };
}

export default async function StudentPage({ params }: { params: Promise<Segment> }) {
  const { id } = await params;
  const student = students.find((entry) => entry.id === id);
  if (!student) return notFound();

  return (
    <section className="hero" style={{ paddingBottom: '2rem' }}>
      <div className="container">
        <Link href="/students" className="mono" style={{ textDecoration: 'none' }}>← People</Link>
        <p className="kicker" style={{ marginTop: '1.25rem' }}>{student.branch} · {student.year}</p>
        <h1>{student.name}</h1>
        <p className="sub">{student.bio}</p>
        <div className="campus-strip" style={{ marginTop: '1.25rem' }}>
          {student.skills.map((skill) => <span key={skill} className="campus-strip__item">{skill}</span>)}
        </div>
        {student.lookingForTeam && (
          <p className="kicker" style={{ marginTop: '1.25rem', color: 'var(--green)' }}>Looking for a team</p>
        )}
        <div className="btn-row">
          <a className="btn btn--dark" href="/community">Ask for an intro</a>
          <Link className="btn btn--ghost" href="/events">See upcoming events</Link>
        </div>
      </div>
    </section>
  );
}
