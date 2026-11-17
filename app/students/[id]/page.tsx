import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/ProfileHeader';
import StudentCta from '@/components/StudentCta';
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
    <>
      <section className="section container" style={{ paddingTop: '1.5rem' }}>
        <Link href="/students" className="mono" style={{ textDecoration: 'none' }}>← People</Link>
        <ProfileHeader displayName={student.name} handle={student.handle} bio={student.bio} />
        <div className="campus-strip" style={{ marginTop: '1rem' }}>
          {student.skills.map((skill) => <span key={skill} className="campus-strip__item">{skill}</span>)}
        </div>
        {student.lookingForTeam && (
          <p className="kicker" style={{ marginTop: '1rem', color: 'var(--green)' }}>Looking for a team</p>
        )}
        <div style={{ marginTop: '1rem' }}>
          <StudentCta />
        </div>
      </section>
    </>
  );
}
