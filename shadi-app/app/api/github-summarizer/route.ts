import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { summarizeReadme } from './chain';
import { createProxyFetch, getSupabaseClient, corsHeaders, type ProxyFetchFunction } from '@/lib/api-utils';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GitHub Action workflow file content
const GITHUB_WORKFLOW_CONTENT = [
  'name: GPT Commits summarizer',
  '# Summary: This action will write a comment about every commit in a pull request,',
  '# as well as generate a summary for every file that was modified and add it to the',
  '# review page, compile a PR summary from all commit summaries and file diff',
  '# summaries, and delete outdated code review comments',
  '',
  'on:',
  '  pull_request:',
  '    types: [opened, synchronize]',
  '',
  'jobs:',
  '  summarize:',
  '    runs-on: ubuntu-latest',
  '    permissions: write-all  # Some repositories need this line',
  '',
  '    steps:',
  '      - uses: KanHarI/gpt-commit-summarizer@master',
  '        env:',
  '          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}',
  '          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}',
].join('\n');

// Helper function to extract API key from request headers
function getApiKeyFromHeaders(request: NextRequest): string | null {
  // Try Authorization header with Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Support both "Bearer <key>" and just "<key>"
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return authHeader.trim();
  }

  // Try X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader.trim();
  }

  return null;
}

// Helper to check if URL is a repository URL (not a file URL)
function isRepositoryUrl(url: string): boolean {
  // Repository URL pattern: https://github.com/owner/repo (no /blob/, /raw/, /tree/, etc.)
  const repoPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+$/;
  return repoPattern.test(url);
}

// Helper to extract owner and repo from URL
function extractOwnerRepo(url: string): { owner: string; repo: string } | null {
  const pattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+)/;
  const match = pattern.exec(url);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

// Helper to get default branch from GitHub API
async function getDefaultBranch(
  owner: string,
  repo: string,
  proxyFetch: ProxyFetchFunction
): Promise<string | null> {
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const response = await proxyFetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'github-summarizer-bot',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const repoData = await response.json();
      return repoData.default_branch || 'main';
    }
    return null;
  } catch {
    return null;
  }
}

// Helper to turn a github.com URL to raw.githubusercontent.com URL for file access.
function githubUrlToRaw(url: string, branch?: string, filePath?: string): string | null {
  try {
    // If branch and filePath are provided (for repository URLs)
    if (branch && filePath) {
      const ownerRepo = extractOwnerRepo(url);
      if (ownerRepo) {
        return `https://raw.githubusercontent.com/${ownerRepo.owner}/${ownerRepo.repo}/${branch}/${filePath}`;
      }
    }

    // Match a GitHub blob URL
    // e.g. https://github.com/owner/repo/blob/branch/path/to/file.txt
    const blobPattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;
    const m = blobPattern.exec(url);
    if (m) {
      const [, owner, repo, branchName, path] = m;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branchName}/${path}`;
    }
    // Support for https://github.com/owner/repo/raw/branch/path as well
    const rawPattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/([^/]+)\/(.+)$/;
    const rawM = rawPattern.exec(url);
    if (rawM) {
      const [, owner, repo, branchName, path] = rawM;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branchName}/${path}`;
    }
    // Not a supported GitHub file URL
    return null;
  } catch {
    return null;
  }
}

// Handle API key validation errors
function handleApiKeyError(error: any): NextResponse {
  // If no rows found, the key is invalid
  if (error.code === 'PGRST116') {
    return NextResponse.json(
      { valid: false, message: 'Invalid API key' },
      { status: 200, headers: corsHeaders }
    );
  }

  // Handle RLS/permission errors
  const isRlsError = error.code === '42501' ||
    error.message.includes('permission denied') ||
    error.message.includes('RLS') ||
    error.message.includes('policy');

  if (isRlsError) {
    console.error('Supabase RLS error:', error);
    return NextResponse.json(
      {
        error: 'Permission denied by Row Level Security (RLS).',
        details: 'Please check your RLS policies in Supabase. The table exists but access is blocked.',
        hint: 'Go to Authentication > Policies in Supabase and ensure there is a policy allowing SELECT operations on api_keys table.',
        code: error.code,
        valid: false
      },
      { status: 403, headers: corsHeaders }
    );
  }

  console.error('Supabase error:', error);
  return NextResponse.json(
    { error: `Database error: ${error.message}`, valid: false },
    { status: 500, headers: corsHeaders }
  );
}

// Validate API key and return key data or error response
async function validateApiKey(
  supabase: ReturnType<typeof createClient>,
  key: string
): Promise<{ data: any; error: NextResponse | null }> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, type, key, usage, limit')
    .eq('key', key)
    .single();

  if (error) {
    return { data: null, error: handleApiKeyError(error) };
  }

  if (!data) {
    return {
      data: null,
      error: NextResponse.json(
        { valid: false, message: 'Invalid API key' },
        { status: 200, headers: corsHeaders }
      )
    };
  }

  return { data, error: null };
}

// Parse and validate request body
async function parseRequestBody(request: NextRequest): Promise<{ githubUrl: string; error: NextResponse | null }> {
  let jsonBody: any;
  try {
    jsonBody = await request.json();
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred while parsing request body';
    return {
      githubUrl: '',
      error: NextResponse.json(
        {
          error: "Invalid request body. Expected JSON with { githubUrl: '...' }",
          details: errorMessage,
          valid: false
        },
        { status: 400, headers: corsHeaders }
      )
    };
  }

  const githubUrl = typeof jsonBody.githubUrl === 'string' ? jsonBody.githubUrl.trim() : null;
  if (!githubUrl || !/^https:\/\/github\.com\/[^/]+\/[^/]+/.test(githubUrl)) {
    return {
      githubUrl: '',
      error: NextResponse.json(
        {
          error: "Missing or invalid githubUrl parameter. Pass JSON: { githubUrl: 'https://github.com/owner/repo' } or { githubUrl: 'https://github.com/owner/repo/blob/main/path/to/file' }",
          valid: false
        },
        { status: 400, headers: corsHeaders }
      )
    };
  }

  return { githubUrl, error: null };
}

// Test if a branch exists by checking README file
async function testBranchExists(
  githubUrl: string,
  branch: string,
  proxyFetch: ProxyFetchFunction
): Promise<boolean> {
  const testUrl = githubUrlToRaw(githubUrl, branch, 'README.md');
  if (!testUrl) {
    return false;
  }

  try {
    const testResponse = await proxyFetch(testUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': 'github-summarizer-bot' }
    });
    return testResponse.ok;
  } catch {
    return false;
  }
}

// Find branch for repository URL
async function findRepositoryBranch(
  githubUrl: string,
  ownerRepo: { owner: string; repo: string },
  proxyFetch: ProxyFetchFunction
): Promise<string> {
  // Try to get default branch from GitHub API
  let branch = await getDefaultBranch(ownerRepo.owner, ownerRepo.repo, proxyFetch);

  // Fallback to common branch names if API fails
  if (!branch) {
    const commonBranches = ['main', 'master', 'develop'];
    for (const commonBranch of commonBranches) {
      if (await testBranchExists(githubUrl, commonBranch, proxyFetch)) {
        branch = commonBranch;
        break;
      }
    }
    // Default to 'main' if nothing works
    if (!branch) {
      branch = 'main';
    }
  }

  return branch;
}

// Find README file for repository
async function findReadmeFile(
  githubUrl: string,
  branch: string,
  proxyFetch: ProxyFetchFunction
): Promise<string | null> {
  const readmeFiles = ['README.md', 'README.txt', 'README', 'readme.md', 'Readme.md'];

  for (const readmeFile of readmeFiles) {
    const testRawUrl = githubUrlToRaw(githubUrl, branch, readmeFile);
    if (testRawUrl) {
      try {
        const testResponse = await proxyFetch(testRawUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'github-summarizer-bot' }
        });
        if (testResponse.ok) {
          return testRawUrl;
        }
      } catch {
        // Continue to next README filename
      }
    }
  }

  // Still try to fetch README.md even if HEAD request failed
  return githubUrlToRaw(githubUrl, branch, 'README.md');
}

// Handle repository URL - find branch and README
async function handleRepositoryUrl(
  githubUrl: string,
  proxyFetch: ProxyFetchFunction
): Promise<{ rawUrl: string | null; error: NextResponse | null }> {
  const ownerRepo = extractOwnerRepo(githubUrl);
  if (!ownerRepo) {
    return {
      rawUrl: null,
      error: NextResponse.json(
        {
          error: "Could not extract owner and repository from the URL.",
          valid: false
        },
        { status: 400, headers: corsHeaders }
      )
    };
  }

  const branch = await findRepositoryBranch(githubUrl, ownerRepo, proxyFetch);
  const rawUrl = await findReadmeFile(githubUrl, branch, proxyFetch);

  return { rawUrl, error: null };
}

// Handle file URL - convert to raw URL
function handleFileUrl(githubUrl: string): { rawUrl: string | null; error: NextResponse | null } {
  const rawUrl = githubUrlToRaw(githubUrl);
  return { rawUrl, error: null };
}

// Fetch content from GitHub
async function fetchGithubContent(
  rawUrl: string,
  proxyFetch: ProxyFetchFunction
): Promise<{ content: string | null; error: string | null }> {
  try {
    const response = await proxyFetch(rawUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'github-summarizer-bot',
        'Accept': 'application/vnd.github.v3.raw'
      }
    });

    if (response.ok) {
      const content = await response.text();
      return { content, error: null };
    } else {
      return {
        content: null,
        error: `Failed to fetch file from GitHub (status ${response.status}): ${response.statusText}`
      };
    }
  } catch (e: any) {
    return {
      content: null,
      error: e instanceof Error ? e.message : String(e)
    };
  }
}

// Helper to log request start
function logRequestStart(request: NextRequest) {
  process.stdout.write('\n');
  process.stdout.write('='.repeat(80) + '\n');
  
  console.log('='.repeat(80));
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  process.stdout.write(`\n[LOG] POST request received at ${new Date().toISOString()}\n`);
}

// Helper to log request failure and return error response
function logFailureAndReturn(
  message: string,
  duration: number,
  errorResponse: NextResponse
): NextResponse {
  console.log(`${message} (${duration}ms)`);
  console.log('='.repeat(80));
  return errorResponse;
}

// Helper to validate API key from request
async function validateRequestApiKey(
  request: NextRequest,
  supabase: ReturnType<typeof createClient>,
  startTime: number
): Promise<{ data: any; error: NextResponse | null }> {
  const key = getApiKeyFromHeaders(request);
  if (!key) {
    console.log('API key missing from request headers');
    return {
      data: null,
      error: NextResponse.json(
        {
          error: 'API key is required',
          valid: false,
          hint: 'Include API key in request header: Authorization: Bearer <key> or X-API-Key: <key>'
        },
        { status: 401, headers: corsHeaders }
      )
    };
  }

  console.log('API key extracted from headers (length):', key.length);
  const { data, error: validationError } = await validateApiKey(supabase, key);
  
  if (validationError) {
    return {
      data: null,
      error: logFailureAndReturn('Request failed: API key validation error', Date.now() - startTime, validationError)
    };
  }

  console.log('API key validated successfully');
  return { data, error: null };
}

// Helper to process GitHub URL and get raw URL
async function processGithubUrl(
  githubUrl: string,
  proxyFetch: ProxyFetchFunction,
  startTime: number
): Promise<{ rawUrl: string | null; isRepoUrl: boolean; error: NextResponse | null }> {
  const isRepoUrl = isRepositoryUrl(githubUrl);
  console.log(`URL type: ${isRepoUrl ? 'Repository URL' : 'File URL'}`);
  
  let rawUrl: string | null = null;
  let urlError: NextResponse | null = null;

  if (isRepoUrl) {
    console.log('Processing repository URL...');
    const result = await handleRepositoryUrl(githubUrl, proxyFetch);
    rawUrl = result.rawUrl;
    urlError = result.error;
  } else {
    console.log('Processing file URL...');
    const result = handleFileUrl(githubUrl);
    rawUrl = result.rawUrl;
    urlError = result.error;
  }

  if (urlError) {
    return {
      rawUrl: null,
      isRepoUrl,
      error: logFailureAndReturn('Request failed: URL processing error', Date.now() - startTime, urlError)
    };
  }

  if (!rawUrl) {
    const errorResponse = NextResponse.json(
      {
        error: isRepoUrl
          ? "Could not construct README.md URL for the repository. The repository might not have a README file."
          : "Provided githubUrl is not a supported GitHub file URL (should be a blob or raw file URL).",
        valid: false
      },
      { status: 400, headers: corsHeaders }
    );
    return {
      rawUrl: null,
      isRepoUrl,
      error: logFailureAndReturn('Request failed: Could not construct raw URL', Date.now() - startTime, errorResponse)
    };
  }

  console.log('Raw URL constructed:', rawUrl);
  return { rawUrl, isRepoUrl, error: null };
}

// Helper to fetch content and generate summary
async function fetchAndSummarize(
  rawUrl: string,
  githubUrl: string,
  proxyFetch: ProxyFetchFunction,
  startTime: number
): Promise<{ githubContent: string | null; summary: any; summaryError: string | null; githubContentError: string | null; error: NextResponse | null }> {
  const { content: githubContent, error: githubContentError } = await fetchGithubContent(rawUrl, proxyFetch);

  if (!githubContent) {
    const errorResponse = NextResponse.json(
      {
        valid: false,
        githubUrl,
        rawUrl,
        githubContentError,
        error: 'Failed to fetch content from GitHub'
      },
      { status: 502, headers: corsHeaders }
    );
    return {
      githubContent: null,
      summary: null,
      summaryError: null,
      githubContentError,
      error: logFailureAndReturn('Request failed: Could not fetch GitHub content', Date.now() - startTime, errorResponse)
    };
  }

  console.log(`GitHub content fetched: ${githubContent.length} characters`);
  console.log('Generating summary...');

  let summary = null;
  let summaryError = null;
  try {
    summary = await summarizeReadme(githubContent, proxyFetch);
    console.log('Summary generated successfully');
    console.log(`Summary length: ${summary.summary.length} characters`);
    console.log(`Cool facts count: ${summary.cool_facts.length}`);
  } catch (error) {
    console.error('Error generating summary:', error);
    summaryError = error instanceof Error ? error.message : 'Failed to generate summary';
  }

  return { githubContent, summary, summaryError, githubContentError, error: null };
}

// Response data structure
interface ResponseData {
  githubUrl: string;
  rawUrl: string;
  githubContent: string;
  summary: any;
  summaryError: string | null;
  githubContentError: string | null;
  keyData: any;
  startTime: number;
}

// Helper to build success response
function buildSuccessResponse(data: ResponseData): NextResponse {
  const statusCode = data.summary ? 200 : 502;
  const duration = Date.now() - data.startTime;
  
  console.log(`Request completed successfully (${duration}ms)`);
  console.log(`Response status: ${statusCode}`);
  console.log('='.repeat(80));

  return NextResponse.json(
    {
      summary: data.summary?.summary || null,
      cool_facts: data.summary?.cool_facts || null
    },
    { status: statusCode, headers: corsHeaders }
  );
}

// POST - Validate API key from header and create GitHub Action workflow file
export async function POST(request: NextRequest) {
  logRequestStart(request);
  const startTime = Date.now();
  
  try {
    const supabase = getSupabaseClient();
    const proxyFetch = createProxyFetch();

    // Validate API key
    const { data, error: keyError } = await validateRequestApiKey(request, supabase, startTime);
    if (keyError) {
      return keyError;
    }

    // Parse and validate request body
    const { githubUrl, error: bodyError } = await parseRequestBody(request);
    if (bodyError) {
      return logFailureAndReturn('Request failed: Invalid request body', Date.now() - startTime, bodyError);
    }

    console.log('Request body parsed. GitHub URL:', githubUrl);

    // Process GitHub URL
    const { rawUrl, error: urlError } = await processGithubUrl(githubUrl, proxyFetch, startTime);
    if (urlError) {
      return urlError;
    }

    // Fetch content and generate summary
    const { githubContent, summary, summaryError, githubContentError, error: fetchError } = await fetchAndSummarize(
      rawUrl!,
      githubUrl,
      proxyFetch,
      startTime
    );
    if (fetchError) {
      return fetchError;
    }

    // Build and return success response
    return buildSuccessResponse({
      githubUrl,
      rawUrl: rawUrl!,
      githubContent: githubContent!,
      summary,
      summaryError,
      githubContentError,
      keyData: data,
      startTime
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ERROR] Request failed after ${duration}ms:`, error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('='.repeat(80));
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json(
      { error: errorMessage, valid: false },
      { status: 500, headers: corsHeaders }
    );
  }
}








