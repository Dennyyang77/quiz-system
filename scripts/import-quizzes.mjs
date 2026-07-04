#!/usr/bin/env node
/**
 * Supabase Quiz Importer
 * 
 * Reads JSON quiz files from quizzes/ folder and upserts them into Supabase.
 * Uses ONLY Node.js built-in modules (fetch, fs, path) — NO npm dependencies.
 * Uses Supabase REST API directly via fetch() for CI compatibility.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ============ CONFIGURATION ============
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const QUIZZES_DIR = path.join(PROJECT_ROOT, 'quizzes');

const DEMO_TEACHER_ID = '00000000-0000-0000-0000-000000000000';
const DEMO_TEACHER_EMAIL = 'demo@teacher.local';
const DEMO_TEACHER_NAME = 'Demo Teacher';

const QUESTION_TYPES = ['fill_in_blank', 'multiple_choice', 'math_expression', 'true_false'];

// ============ SUPABASE API HELPERS ============

/**
 * Get Supabase configuration from environment variables
 */
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!url) {
    throw new Error('Missing required environment variable: SUPABASE_URL must be set');
  }
  
  const apiKey = serviceRoleKey || anonKey;
  if (!apiKey) {
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set');
  }
  
  const keyType = serviceRoleKey ? 'service_role (RLS bypassed)' : 'anon (RLS active)';
  console.log(`Supabase auth: ${keyType}`);
  
  return { url, apiKey };
}

/**
 * Make a request to Supabase REST API
 */
async function supabaseRequest(config, method, table, body = null, params = {}, options = {}) {
  const { url, apiKey } = config;
  
  let endpoint = `${url}/rest/v1/${table}`;
  
  // Add query params if provided
  const queryString = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  
  if (queryString) {
    endpoint += `?${queryString}`;
  }
  
  const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  
  // Build Prefer header from options.prefer array
  if (options.prefer && options.prefer.length > 0) {
    headers['Prefer'] = options.prefer.join(', ');
  }
  
  const fetchOptions = {
    method,
    headers,
  };
  
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }
  
  const response = await fetch(endpoint, fetchOptions);
  
  // Supabase returns 201 for insert, 200 for update/delete
  if (!response.ok && response.status !== 201) {
    const errorText = await response.text();
    throw new Error(`Supabase API error (${response.status}): ${errorText}`);
  }
  
  // Parse response based on Prefer header
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  
  return null;
}

/**
 * Upsert a record (insert or update on conflict)
 */
async function upsert(config, table, body, conflictColumn = 'id') {
  const params = {
    'on_conflict': conflictColumn,
  };
  
  const options = {
    prefer: ['return=representation', 'resolution=merge-duplicates'],
  };
  
  return supabaseRequest(config, 'POST', table, body, params, options);
}

/**
 * Insert a record
 */
async function insert(config, table, body) {
  return supabaseRequest(config, 'POST', table, body);
}

/**
 * Update a record
 */
async function update(config, table, body, params = {}) {
  return supabaseRequest(config, 'PATCH', table, body, params);
}

/**
 * Delete records
 */
async function del(config, table, params = {}) {
  return supabaseRequest(config, 'DELETE', table, undefined, params);
}

/**
 * Select records
 */
async function select(config, table, params = {}) {
  return supabaseRequest(config, 'GET', table, null, params);
}

// ============ VALIDATION ============

/**
 * Validate a single question object
 */
function validateQuestion(question, questionIndex) {
  const errors = [];
  
  if (!question.type || !QUESTION_TYPES.includes(question.type)) {
    errors.push(`  Question ${questionIndex + 1}: Invalid type '${question.type}'. Must be one of: ${QUESTION_TYPES.join(', ')}`);
  }
  
  const questionText = question.question || question.question_text;
  if (!questionText || typeof questionText !== 'string') {
    errors.push(`  Question ${questionIndex + 1}: Missing 'question' or 'question_text' field (string required)`);
  }
  
  if (!question.spoken || typeof question.spoken !== 'string') {
    errors.push(`  Question ${questionIndex + 1}: Missing 'spoken' field (string required)`);
  }
  
  if (!question.correct_answer || typeof question.correct_answer !== 'string') {
    errors.push(`  Question ${questionIndex + 1}: Missing 'correct_answer' field (string required)`);
  }
  
  return errors;
}

/**
 * Validate a quiz JSON object
 */
function validateQuiz(quiz, filename) {
  const errors = [];
  
  if (!quiz.quiz_title || typeof quiz.quiz_title !== 'string') {
    errors.push(`${filename}: Missing 'quiz_title' field (string required)`);
    return { valid: false, errors };
  }
  
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    errors.push(`${filename}: Missing or empty 'questions' array (at least 1 question required)`);
    return { valid: false, errors };
  }
  
  // Validate each question
  quiz.questions.forEach((question, index) => {
    const questionErrors = validateQuestion(question, index);
    errors.push(...questionErrors);
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============ FILE SCANNING ============

/**
 * Scan quizzes directory for JSON files
 */
function scanQuizFiles() {
  if (!fs.existsSync(QUIZZES_DIR)) {
    console.log(`Quizzes directory does not exist: ${QUIZZES_DIR}`);
    console.log('Creating quizzes directory...');
    fs.mkdirSync(QUIZZES_DIR, { recursive: true });
    return [];
  }
  
  const files = fs.readdirSync(QUIZZES_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      path: path.join(QUIZZES_DIR, file),
      name: file,
    }));
  
  return files;
}

/**
 * Read and parse a quiz JSON file
 */
function readQuizFile(filePath, filename) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const quiz = JSON.parse(content);
    return { quiz, error: null };
  } catch (error) {
    return { quiz: null, error: `Failed to parse ${filename}: ${error.message}` };
  }
}

// ============ DATABASE OPERATIONS ============

/**
 * Ensure demo teacher exists in users table
 */
async function ensureDemoTeacher(config) {
  console.log('Ensuring demo teacher exists...');
  
  try {
    await upsert(config, 'users', {
      id: DEMO_TEACHER_ID,
      email: DEMO_TEACHER_EMAIL,
      name: DEMO_TEACHER_NAME,
      role: 'teacher',
    });
    console.log('Demo teacher ready.\n');
  } catch (error) {
    console.error('Warning: Could not upsert demo teacher:', error.message);
    console.log('Continuing anyway...\n');
  }
}

/**
 * Check if a quiz with the given title exists in the database
 */
async function findExistingQuiz(config, title) {
  const result = await select(config, 'quizzes', {
    'title': `eq.${title}`,
    'description': `ilike.%[github]%`,
    'select': 'id',
    'limit': 1,
  });
  
  return Array.isArray(result) && result.length > 0 ? result[0] : null;
}

/**
 * Delete all questions for a quiz
 */
async function deleteQuizQuestions(config, quizId) {
  await del(config, 'questions', {
    'quiz_id': `eq.${quizId}`,
  });
}

/**
 * Update an existing quiz
 */
async function updateQuiz(config, quizId, quizData) {
  const description = quizData.description 
    ? `[github] ${quizData.description}`
    : '[github]';
  
  await update(config, 'quizzes', {
    description,
    subject: quizData.subject || null,
    grade: quizData.grade || null,
    time_limit: quizData.time_limit || null,
    status: 'published',
    created_by: DEMO_TEACHER_ID,
  }, {
    'id': `eq.${quizId}`,
  });
}

/**
 * Insert a new quiz
 */
async function insertQuiz(config, quizData) {
  const description = quizData.description 
    ? `[github] ${quizData.description}`
    : '[github]';
  
  const result = await insert(config, 'quizzes', {
    title: quizData.quiz_title,
    description,
    subject: quizData.subject || null,
    grade: quizData.grade || null,
    time_limit: quizData.time_limit || null,
    status: 'published',
    created_by: DEMO_TEACHER_ID,
  });
  
  return result[0]?.id;
}

/**
 * Insert questions for a quiz
 */
async function insertQuestions(config, quizId, questions) {
  const questionRecords = questions.map((q, index) => ({
    quiz_id: quizId,
    type: q.type,
    question_text: q.question || q.question_text,
    latex: q.latex || null,
    spoken: q.spoken,
    options: q.options || null,
    correct_answer: q.correct_answer,
    hint: q.hint || null,
    difficulty: q.difficulty || 'medium',
    order_index: index + 1,
  }));
  
  await insert(config, 'questions', questionRecords);
}

/**
 * Find github-sourced quizzes in DB that no longer have a corresponding file
 */
async function findOrphanedQuizzes(config, importedTitles) {
  // Get all quizzes where description starts with [github]
  const allGithubQuizzes = await select(config, 'quizzes', {
    'description': `ilike.[github]%`,
    'select': 'id,title',
  });
  
  if (!Array.isArray(allGithubQuizzes)) {
    return [];
  }
  
  // Filter out quizzes that still have a file
  const orphaned = allGithubQuizzes.filter(quiz => {
    return !importedTitles.has(quiz.title);
  });
  
  return orphaned;
}

/**
 * Delete orphaned quizzes
 */
async function deleteOrphanedQuizzes(config, orphanedQuizzes) {
  for (const quiz of orphanedQuizzes) {
    try {
      await del(config, 'quizzes', { 'id': `eq.${quiz.id}` });
      console.log(`  Deleted orphaned quiz: "${quiz.title}"`);
    } catch (error) {
      console.error(`  Warning: Failed to delete quiz "${quiz.title}": ${error.message}`);
    }
  }
}

// ============ MAIN IMPORT LOGIC ============

/**
 * Import a single quiz file
 */
async function importQuiz(config, file) {
  const { quiz, error } = readQuizFile(file.path, file.name);
  
  if (error) {
    console.error(`❌ ${error}`);
    return { status: 'error', file: file.name };
  }
  
  const validation = validateQuiz(quiz, file.name);
  if (!validation.valid) {
    console.error(`❌ ${file.name}: Validation failed`);
    validation.errors.forEach(e => console.error(e));
    return { status: 'error', file: file.name };
  }
  
  console.log(`Processing: "${quiz.quiz_title}" (${quiz.questions.length} questions)`);
  
  try {
    // Check if quiz already exists
    const existingQuiz = await findExistingQuiz(config, quiz.quiz_title);
    
    if (existingQuiz) {
      // Update existing quiz
      console.log(`  → Updating existing quiz (id: ${existingQuiz.id})`);
      
      // Delete old questions first
      await deleteQuizQuestions(config, existingQuiz.id);
      
      // Update quiz metadata
      await updateQuiz(config, existingQuiz.id, quiz);
      
      // Insert new questions
      await insertQuestions(config, existingQuiz.id, quiz.questions);
      
      console.log(`  ✓ Updated successfully`);
      return { status: 'updated', file: file.name, title: quiz.quiz_title };
    } else {
      // Insert new quiz
      console.log(`  → Creating new quiz`);
      
      const quizId = await insertQuiz(config, quiz);
      
      // Insert questions
      await insertQuestions(config, quizId, quiz.questions);
      
      console.log(`  ✓ Created successfully (id: ${quizId})`);
      return { status: 'created', file: file.name, title: quiz.quiz_title };
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return { status: 'error', file: file.name, error: error.message };
  }
}

// ============ MAIN ============

async function main() {
  console.log('═'.repeat(60));
  console.log('SUPABASE QUIZ IMPORTER');
  console.log('═'.repeat(60));
  console.log();
  
  let config;
  try {
    config = getSupabaseConfig();
    console.log(`Supabase URL: ${config.url}`);
    console.log(`Quizzes directory: ${QUIZZES_DIR}`);
    console.log();
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
    process.exit(1);
  }
  
  // Ensure demo teacher exists
  await ensureDemoTeacher(config);
  
  // Scan for quiz files
  console.log('Scanning for quiz files...');
  const quizFiles = scanQuizFiles();
  
  if (quizFiles.length === 0) {
    console.log('No quiz files found in quizzes/ directory.');
    console.log('Place JSON quiz files in the quizzes/ folder and run again.');
    console.log();
    // Still check for orphaned quizzes to clean up
    const orphaned = await findOrphanedQuizzes(config, new Set());
    if (orphaned.length > 0) {
      console.log(`Found ${orphaned.length} orphaned quiz(es) to delete...`);
      await deleteOrphanedQuizzes(config, orphaned);
    }
    console.log('Import complete. Summary: Imported 0 quizzes, Updated 0 quizzes, Deleted 0 quizzes');
    return;
  }
  
  console.log(`Found ${quizFiles.length} quiz file(s):`);
  quizFiles.forEach(f => console.log(`  - ${f.name}`));
  console.log();
  
  // Import each quiz
  const results = {
    created: [],
    updated: [],
    errors: [],
  };
  
  for (const file of quizFiles) {
    const result = await importQuiz(config, file);
    
    if (result.status === 'created') {
      results.created.push(result);
    } else if (result.status === 'updated') {
      results.updated.push(result);
    } else {
      results.errors.push(result);
    }
    
    console.log();
  }
  
  // Clean up orphaned quizzes
  const importedTitles = new Set([
    ...results.created.map(r => r.title),
    ...results.updated.map(r => r.title),
  ]);
  
  const orphanedQuizzes = await findOrphanedQuizzes(config, importedTitles);
  let deletedCount = 0;
  
  if (orphanedQuizzes.length > 0) {
    console.log(`Cleaning up ${orphanedQuizzes.length} orphaned quiz(es)...`);
    const beforeCount = deletedCount;
    await deleteOrphanedQuizzes(config, orphanedQuizzes);
    deletedCount = orphanedQuizzes.length;
    console.log();
  }
  
  // Print summary
  console.log('═'.repeat(60));
  console.log('IMPORT SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Imported: ${results.created.length} quiz(es)`);
  console.log(`Updated:  ${results.updated.length} quiz(es)`);
  console.log(`Deleted:  ${deletedCount} quiz(es)`);
  
  if (results.errors.length > 0) {
    console.log(`Errors:   ${results.errors.length} quiz(es)`);
    console.log('\nFailed imports:');
    results.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }
  
  console.log();
  console.log(`Summary: Imported ${results.created.length} quizzes, Updated ${results.updated.length} quizzes, Deleted ${deletedCount} quizzes`);
  console.log('═'.repeat(60));
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});