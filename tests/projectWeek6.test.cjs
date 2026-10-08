/* eslint-disable @typescript-eslint/no-require-imports -- Node's CommonJS loader is used to transpile the existing TS modules for these tests. */
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Load the existing TypeScript modules without adding a test runner dependency.
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(
    this,
    request.startsWith('@/') ? path.join(root, request.slice(2)) : request,
    ...args,
  );
};
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  module._compile(output.outputText, filename);
};
const stored = new Map();
global.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
  removeItem: (key) => stored.delete(key),
};
global.location = new URL('http://localhost:3000');
const nativeFetch = global.fetch;
const { setupServer } = require('msw/node');
const { projectWeek6Handlers } = require('../mocks/projectWeek6Handlers.ts');
const storage = require('../mocks/storage.ts');
const api = require('../components/features/project/applicationApi.ts');
const { projectApplicationSchema } = require('../components/features/project/apply/schema.ts');
const server = setupServer(...projectWeek6Handlers);
const payload = {
  jobPositionCode: 'JAVA_SPRING',
  motivation: '함께 안정적인 서비스를 만들고 싶습니다.',
};
before(() => {
  server.listen({ onUnhandledRequest: 'error' });
  const intercepted = global.fetch;
  global.fetch = (url, init) => intercepted(new URL(url, global.location).href, init);
});
after(() => {
  server.close();
  global.fetch = nativeFetch;
});
beforeEach(() => {
  stored.clear();
  storage.setSession(1);
});
function changeProject(change) {
  const projects = storage.getProjects();
  localStorage.setItem(
    'meeteam-week5-projects',
    JSON.stringify(projects.map((project) => (project.id === 102 ? change(project) : project))),
  );
}
test('validation rejects blank role, short and overlong motivations; trims valid input', () => {
  assert.equal(
    projectApplicationSchema.safeParse({ ...payload, jobPositionCode: '' }).success,
    false,
  );
  assert.equal(
    projectApplicationSchema.safeParse({ ...payload, motivation: '짧음' }).success,
    false,
  );
  assert.equal(
    projectApplicationSchema.safeParse({ ...payload, motivation: 'a'.repeat(1001) }).success,
    false,
  );
  assert.equal(
    projectApplicationSchema.parse({ ...payload, motivation: `  ${payload.motivation}  ` })
      .motivation,
    payload.motivation,
  );
});
test('application form contract resolves role names and applicant skills', async () => {
  const page = await api.getApplicationPage(102);
  assert.equal(page.applicant.name, '김민지');
  assert.equal(page.recruitments[0].jobPositionName, 'Java/Spring');
});
test('submit, list, own detail, cancel and refreshed list follow API contract', async () => {
  const result = await api.submitApplication(102, payload);
  assert.equal(result.status, 'PENDING');
  assert.equal((await api.getMyApplications()).length, 1);
  assert.equal(
    (await api.getApplicationDetail(102, result.applicationId)).motivation,
    payload.motivation,
  );
  await api.cancelApplication(result.applicationId);
  assert.equal((await api.getMyApplications())[0].status, 'CANCELLED');
  await assert.rejects(api.cancelApplication(result.applicationId), /대기 중/);
  await assert.rejects(api.submitApplication(102, payload), /이미 신청/);
});
test('duplicate submission is rejected without adding another record', async () => {
  await api.submitApplication(102, payload);
  await assert.rejects(api.submitApplication(102, payload), /이미 신청/);
  assert.equal(storage.getApplications().length, 1);
});
test('leader and member cannot apply', async () => {
  storage.setSession(2);
  await assert.rejects(api.submitApplication(102, payload), (error) => error.status === 403);
  storage.setSession(1);
  changeProject((project) => ({ ...project, memberIds: [1] }));
  await assert.rejects(api.submitApplication(102, payload), (error) => error.status === 403);
});
test('closed, suspended and past-deadline projects reject applications', async () => {
  for (const change of [
    { recruitmentStatus: 'CLOSED' },
    { recruitmentStatus: 'SUSPENDED' },
    { recruitmentStatus: 'RECRUITING', deadline: '2000-01-01' },
  ]) {
    changeProject((project) => ({ ...project, ...change }));
    await assert.rejects(api.submitApplication(102, payload), /마감/);
  }
});
test('full positions reject applications', async () => {
  changeProject((project) => ({
    ...project,
    recruitments: project.recruitments.map((item) => ({ ...item, currentCount: item.count })),
  }));
  await assert.rejects(api.submitApplication(102, payload), /인원이 모두/);
});
test('missing project and unavailable role are rejected', async () => {
  await assert.rejects(api.submitApplication(999999, payload), (error) => error.status === 404);
  await assert.rejects(
    api.submitApplication(102, { ...payload, jobPositionCode: 'WEB_FRONTEND' }),
    /현재 모집/,
  );
});
test('another user cannot view or cancel an application', async () => {
  const result = await api.submitApplication(102, payload);
  storage.setSession(2);
  assert.equal((await api.getMyApplications()).length, 0);
  await assert.rejects(
    api.getApplicationDetail(102, result.applicationId),
    (error) => error.status === 403,
  );
  await assert.rejects(
    api.cancelApplication(result.applicationId),
    (error) => error.status === 403,
  );
});
test('non-pending application cannot be cancelled', async () => {
  const result = await api.submitApplication(102, payload);
  storage.saveApplication({ ...storage.getApplications()[0], status: 'ACCEPTED' });
  await assert.rejects(api.cancelApplication(result.applicationId), /대기 중/);
});
test('server and network failures do not create applications', async () => {
  await assert.rejects(
    api.submitApplication(102, {
      ...payload,
      motivation: '서버오류 테스트를 위한 충분한 지원 동기입니다.',
    }),
    (error) => error.status === 500,
  );
  await assert.rejects(
    api.submitApplication(102, {
      ...payload,
      motivation: '네트워크오류 테스트를 위한 충분한 지원 동기입니다.',
    }),
  );
  assert.equal(storage.getApplications().length, 0);
});
test('like toggles reflect status and counts and Q&A returns answers', async () => {
  assert.equal((await api.getProjectLike(102)).isLiked, false);
  assert.deepEqual(await api.toggleProjectLike(102), { projectId: 102, liked: true, likeCount: 1 });
  assert.equal((await api.getProjectLike(102)).isLiked, true);
  assert.equal((await api.toggleProjectLike(102)).likeCount, 0);
  assert.equal((await api.getProjectQnas(102, 0)).content[0].answers.length, 1);
});
test('unauthenticated requests are denied', async () => {
  storage.clearSession();
  // Check the endpoint directly, avoiding a refresh request outside this handler suite.
  const response = await fetch('http://localhost:3000/api/v1/projects/102/application', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  assert.equal(response.status, 401);
});
