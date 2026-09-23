#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const fixturePath = resolve(process.argv[2] ?? 'scripts/fixtures/store-demo-v1.5.0.json');

function fail(message) {
  throw new Error(`Invalid store demo fixture: ${message}`);
}

function requireArray(value, name) {
  if (!Array.isArray(value)) fail(`${name} must be an array`);
  return value;
}

function idSet(rows, name) {
  const ids = new Set();
  for (const row of rows) {
    if (!Number.isInteger(row.id) || row.id <= 0) fail(`${name} has an invalid id`);
    if (ids.has(row.id)) fail(`${name} contains duplicate id ${row.id}`);
    ids.add(row.id);
  }
  return ids;
}

function requireReference(ids, value, label) {
  if (!ids.has(value)) fail(`${label} references missing id ${String(value)}`);
}

function requireEnum(value, allowed, label) {
  if (!allowed.includes(value)) fail(`${label} has invalid value ${String(value)}`);
}

function requireIsoDate(value, label, monthOnly = false) {
  const pattern = monthOnly ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/;
  if (typeof value !== 'string' || !pattern.test(value)) fail(`${label} is not an ISO date`);
}

async function main() {
  let fixture;
  try {
    fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  } catch (error) {
    fail(`could not read JSON at ${fixturePath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (fixture.version !== 4) fail('version must be 4');
  if (Number.isNaN(Date.parse(fixture.exported_at))) fail('exported_at must be an ISO timestamp');

  const arrayNames = [
    'centers',
    'class_types',
    'organizers',
    'trainees',
    'class_series',
    'series_trainees',
    'class_sessions',
    'session_trainees',
    'organizer_payments',
    'trainee_packages',
    'settings',
  ];
  for (const name of arrayNames) requireArray(fixture[name], name);

  const centerIds = idSet(fixture.centers, 'centers');
  const classTypeIds = idSet(fixture.class_types, 'class_types');
  const organizerIds = idSet(fixture.organizers, 'organizers');
  const traineeIds = idSet(fixture.trainees, 'trainees');
  const seriesIds = idSet(fixture.class_series, 'class_series');
  idSet(fixture.series_trainees, 'series_trainees');
  const sessionIds = idSet(fixture.class_sessions, 'class_sessions');
  idSet(fixture.session_trainees, 'session_trainees');
  idSet(fixture.organizer_payments, 'organizer_payments');
  idSet(fixture.trainee_packages, 'trainee_packages');

  for (const person of [...fixture.organizers, ...fixture.trainees]) {
    if (person.phone || person.email || person.notes) {
      fail(`${person.name ?? 'person'} must not contain phone, email, or notes`);
    }
    if (typeof person.name !== 'string' || !person.name.includes('Demo')) {
      fail(`${person.name ?? 'person'} must be clearly marked as Demo`);
    }
  }
  for (const center of fixture.centers) {
    if (typeof center.name !== 'string' || !center.name.includes('Demo')) {
      fail(`${center.name ?? 'center'} must be clearly marked as Demo`);
    }
  }

  for (const series of fixture.class_series) {
    requireReference(classTypeIds, series.class_type_id, `class_series ${series.id}`);
    requireEnum(series.source_type, ['organizer', 'personal'], `class_series ${series.id}.source_type`);
    requireEnum(series.recurrence_type, ['daily', 'weekly', 'custom'], `class_series ${series.id}.recurrence_type`);
    requireEnum(series.location_type, ['offline', 'online'], `class_series ${series.id}.location_type`);
    requireIsoDate(series.start_date, `class_series ${series.id}.start_date`);
    if (series.end_date) requireIsoDate(series.end_date, `class_series ${series.id}.end_date`);
    if (series.source_type === 'organizer') {
      requireReference(organizerIds, series.organizer_id, `class_series ${series.id}`);
    } else if (series.organizer_id != null) {
      fail(`personal class_series ${series.id} must not have organizer_id`);
    }
    if (series.center_id != null) requireReference(centerIds, series.center_id, `class_series ${series.id}`);
  }

  const seriesTraineeKeys = new Set();
  for (const link of fixture.series_trainees) {
    requireReference(seriesIds, link.series_id, `series_trainees ${link.id}`);
    requireReference(traineeIds, link.trainee_id, `series_trainees ${link.id}`);
    const key = `${link.series_id}:${link.trainee_id}`;
    if (seriesTraineeKeys.has(key)) fail(`duplicate series_trainees link ${key}`);
    seriesTraineeKeys.add(key);
  }

  const seriesById = new Map(fixture.class_series.map((row) => [row.id, row]));
  const sessionById = new Map();
  const sessionDateKeys = new Set();
  for (const session of fixture.class_sessions) {
    requireReference(seriesIds, session.series_id, `class_sessions ${session.id}`);
    requireEnum(session.status, ['upcoming', 'completed', 'cancelled', 'skipped'], `class_sessions ${session.id}.status`);
    requireIsoDate(session.session_date, `class_sessions ${session.id}.session_date`);
    if (session.center_id != null) requireReference(centerIds, session.center_id, `class_sessions ${session.id}`);
    const key = `${session.series_id}:${session.session_date}`;
    if (sessionDateKeys.has(key)) fail(`duplicate class session ${key}`);
    sessionDateKeys.add(key);
    sessionById.set(session.id, session);
  }

  const sessionTraineeKeys = new Set();
  for (const link of fixture.session_trainees) {
    requireReference(sessionIds, link.session_id, `session_trainees ${link.id}`);
    requireReference(traineeIds, link.trainee_id, `session_trainees ${link.id}`);
    const key = `${link.session_id}:${link.trainee_id}`;
    if (sessionTraineeKeys.has(key)) fail(`duplicate session_trainees link ${key}`);
    sessionTraineeKeys.add(key);
  }

  const paidSessionIds = new Set();
  for (const payment of fixture.organizer_payments) {
    requireReference(sessionIds, payment.session_id, `organizer_payments ${payment.id}`);
    requireReference(organizerIds, payment.organizer_id, `organizer_payments ${payment.id}`);
    requireEnum(payment.status, ['pending', 'paid'], `organizer_payments ${payment.id}.status`);
    if (!Number.isFinite(payment.amount) || payment.amount < 0) fail(`organizer_payments ${payment.id} has invalid amount`);
    if (paidSessionIds.has(payment.session_id)) fail(`multiple organizer payments for session ${payment.session_id}`);
    paidSessionIds.add(payment.session_id);
    const session = sessionById.get(payment.session_id);
    const series = seriesById.get(session.series_id);
    if (series.source_type !== 'organizer' || series.organizer_id !== payment.organizer_id) {
      fail(`organizer_payments ${payment.id} does not match its session organizer`);
    }
  }

  const pendingPackageKeys = new Set();
  for (const pkg of fixture.trainee_packages) {
    requireReference(traineeIds, pkg.trainee_id, `trainee_packages ${pkg.id}`);
    if (pkg.series_id != null) requireReference(seriesIds, pkg.series_id, `trainee_packages ${pkg.id}`);
    requireEnum(pkg.status, ['pending', 'paid'], `trainee_packages ${pkg.id}.status`);
    requireIsoDate(pkg.month, `trainee_packages ${pkg.id}.month`, true);
    if (!Number.isFinite(pkg.amount) || pkg.amount < 0) fail(`trainee_packages ${pkg.id} has invalid amount`);
    if (pkg.used_sessions < 0 || pkg.used_sessions > pkg.total_sessions) {
      fail(`trainee_packages ${pkg.id} has invalid session usage`);
    }
    if (pkg.status === 'pending') {
      const key = `${pkg.trainee_id}:${pkg.month}`;
      if (pendingPackageKeys.has(key)) fail(`duplicate pending trainee package ${key}`);
      pendingPackageKeys.add(key);
    }
  }

  const settings = new Map();
  for (const setting of fixture.settings) {
    if (settings.has(setting.key)) fail(`duplicate setting ${setting.key}`);
    settings.set(setting.key, setting.value);
  }
  for (const key of ['theme', 'accent_color', 'onboarding_done', 'trainer_name', 'last_seen_whats_new_version']) {
    if (!settings.has(key)) fail(`missing required setting ${key}`);
  }
  if (settings.get('onboarding_done') !== 'true') fail('onboarding_done must be true');
  if (!settings.get('trainer_name').includes('Demo')) fail('trainer_name must be clearly marked as Demo');

  const dates = fixture.class_sessions.map((row) => row.session_date).sort();
  if (dates.length === 0) fail('at least one class session is required');
  const completed = fixture.class_sessions.filter((row) => row.status === 'completed').length;
  const upcoming = fixture.class_sessions.filter((row) => row.status === 'upcoming').length;
  const skipped = fixture.class_sessions.filter((row) => row.status === 'skipped').length;
  const paid = fixture.organizer_payments.filter((row) => row.status === 'paid').length;
  const pending = fixture.organizer_payments.filter((row) => row.status === 'pending').length;

  console.log(`Fixture: ${fixturePath}`);
  console.log(`Date range: ${dates[0]} to ${dates.at(-1)}`);
  console.log(`Records: ${fixture.centers.length} centers, ${fixture.organizers.length} organizers, ${fixture.trainees.length} trainees, ${fixture.class_series.length} series`);
  console.log(`Sessions: ${fixture.class_sessions.length} total (${completed} completed, ${upcoming} upcoming, ${skipped} skipped)`);
  console.log(`Payments: ${fixture.organizer_payments.length} organizer (${paid} paid, ${pending} pending), ${fixture.trainee_packages.length} trainee packages`);
  console.log('Fixture validation: OK');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
