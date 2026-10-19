import test from 'node:test';
import assert from 'node:assert/strict';
import { getTaskEnrollment } from '../lib/tasks/task-enrollment.mjs';

const enrollments = [
  { id: 'backend-enrollment', internship_id: 'backend', status: 'active' },
  { id: 'frontend-enrollment', internship_id: 'frontend', status: 'active' },
  { id: 'old-enrollment', internship_id: 'design', status: 'cancelled' },
];

test('an opened task uses its own enrollment even when another program is first', () => {
  assert.equal(getTaskEnrollment(enrollments, 'frontend')?.id, 'frontend-enrollment');
  assert.equal(getTaskEnrollment(enrollments, 'backend')?.id, 'backend-enrollment');
});

test('unrelated, cancelled and absent enrollments cannot submit a task', () => {
  assert.equal(getTaskEnrollment(enrollments, 'design'), null);
  assert.equal(getTaskEnrollment(enrollments, 'unknown'), null);
  assert.equal(getTaskEnrollment(enrollments, undefined), null);
  assert.equal(getTaskEnrollment([], 'backend'), null);
});
