/** Resolve the enrollment belonging to the opened task, never the first program.
 * @param {import('../../types/database').Enrollment[]} enrollments
 * @param {string|undefined} internshipId
 * @returns {import('../../types/database').Enrollment|null}
 */
export function getTaskEnrollment(enrollments, internshipId) {
  if (!internshipId) return null;
  return enrollments.find((item) => item.status === 'active' && item.internship_id === internshipId) ?? null;
}
