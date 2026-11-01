import { readdirSync, readFileSync } from 'node:fs';
import { validateBriefing } from '../src/content/schema';

const directory = new URL('../src/content/briefings/', import.meta.url);
const files = readdirSync(directory).filter((f) => f.endsWith('.json'));
if (!files.length) throw new Error('No briefing content found');
for (const file of files) {
  try {
    const { briefing, warnings } = validateBriefing(
      JSON.parse(readFileSync(new URL(file, directory), 'utf8')),
      {
        production: process.env.NODE_ENV === 'production' || process.argv.includes('--production'),
        allowUnapproved: process.env.ALLOW_UNAPPROVED === '1',
      },
    );
    for (const source of briefing.sources) {
      if (!source.url.startsWith('/charts/')) continue;
      const packaged = new URL(`../public${source.url}`, import.meta.url);
      const bytes = readFileSync(packaged);
      if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff)
        throw new Error(`Missing or invalid JPEG chart: ${source.url}`);
    }
    const courseDirectory = new URL('../src/content/courses/', import.meta.url);
    const courseExists = readdirSync(courseDirectory)
      .filter((f) => f.endsWith('.json'))
      .some((name) => {
        const course = JSON.parse(readFileSync(new URL(name, courseDirectory), 'utf8'));
        return (
          course.courseId === briefing.courseId && course.courseVersion === briefing.courseVersion
        );
      });
    if (!courseExists) throw new Error('Referenced course ID/version is missing');
    for (const warning of warnings) console.warn(`${file}: ${warning}`);
    console.log(`Valid: ${file}`);
  } catch (error) {
    console.error(`${file}: ${String(error)}`);
    process.exitCode = 1;
  }
}
