import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { renderPage, build } from '../scripts/build.js';
test('all 25 public entry points render with shared layouts and external scripts', async () => {
  const pages = (await readdir('src/pages')).filter(n => n.endsWith('.html'));
  assert.equal(pages.length, 25);
  for (const page of pages) {
    const html = await renderPage(page);
    assert.doesNotMatch(html, /<!-- include:/);
    const active = html.replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(active, /<style\b/i);
    for (const script of active.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      assert.match(script[1], /src=/); assert.equal(script[2].trim(), '');
    }
    for (const match of active.matchAll(/(?:src|href)="(\.\/src\/[^"#]+)"/g)) await access(match[1]);
  }
});
test('page scripts do not leak raw error objects into the UI', async () => {
  for (const name of await readdir('src/scripts/pages')) {
    const source = await readFile(`src/scripts/pages/${name}`, 'utf8');
    assert.doesNotMatch(source, /JSON.stringify\(error\)/);
    assert.doesNotMatch(source, /const renderReview =/, `${name}: review rendering belongs in src/scripts/reviews.js`);
  }
});
test('shared review module: safe rendering, 5 newest by createdAt + all-reviews dialog, sign-in before writes', async () => {
  const source = await readFile('src/scripts/reviews.js', 'utf8');
  assert.doesNotMatch(source, /innerHTML|insertAdjacentHTML|outerHTML|document\.write/);
  assert.match(source, /const byNewest = orderBy\("createdAt", "desc"\)/);
  assert.match(source, /const REVIEW_LIMIT = 5;/);
  assert.match(source, /getDocs\(query\(col, byNewest, limit\(REVIEW_LIMIT\)\)\)/);
  for (const q of source.matchAll(/query\(col,([^)]*)/g)) assert.match(q[1], /byNewest/);
  assert.match(source, /query\(col, byNewest, startAfter\(cursor\), limit\(SEE_ALL_BATCH\)\)/);
  assert.match(source, /Math\.min\(5/);
  const submit = source.split('form.addEventListener("submit"')[1];
  assert.ok(submit.indexOf('auth.currentUser') < submit.indexOf('addDoc('), 'sign-in check precedes write');
  const payload = submit.split('addDoc(col, {')[1].split('});')[0];
  assert.match(payload, /uid: user\.uid/);
  assert.match(payload, /authorName: authorNameOf\(user\)/);
  assert.doesNotMatch(payload, /email/);
  assert.doesNotMatch(payload, /autoriser/);
  for (const page of ['index.html', 'fr_index.html', 'en_index.html']) {
    const html = await renderPage(page);
    for (const id of ['reviewsList', 'seeAllBtn', 'reviewDetailDialog', 'allReviewsDialog', 'allReviewsList', 'allReviewsTitle', 'allReviewsSort', 'allReviewsSearch', 'allReviewsSearchBtn', 'allReviewsSearchWrap', 'allReviewsLoading', 'allReviewsEmpty', 'allReviewsStatus', 'closeAllReviews', 'reviewDetailBody', 'closeReviewDetail', 'writeReviewBtn', 'authStatus', 'authName', 'signOutBtn', 'reviewDialog',
      'closeReviewDialog', 'formAvis', 'submitBtn', 'formFeedback', 'reviewsEmpty', 'reviewsStatus', 'avgRating', 'reviewsCount']) {
      assert.equal(html.split(`id="${id}"`).length - 1, 1, `${page} has exactly one #${id}`);
    }
  }
});
test('production build preserves entry point filenames', async () => {
  await build();
  for (const name of await readdir('src/pages')) await access(`dist/${name}`);
});
