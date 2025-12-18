import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";

// Type alias for fetch function
type ProxyFetchFunction = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Strict Zod schema for summary and cool facts
 */
const summarySchema = z.object({
  summary: z
    .string()
    .describe("A concise summary (3-5 sentences) of the GitHub repository/project conveyed in the README"),
  cool_facts: z
    .array(z.string().describe("A single interesting or notable fact about the project"))
    .min(1)
    .describe("A list of 3 to 7 cool or notable facts about the project."),
});

/**
 * Prompt template for summarization
 */
const createPrompt = () => PromptTemplate.fromTemplate(
  `
You are an expert technical writer.
Summarize the following README.md file for a GitHub repository for someone seeing it for the first time.

- Write a concise summary (3-5 sentences) describing what the project is, its main features, and its purpose.
- Extract a list of 3 to 7 "cool facts" or notable, interesting, or fun aspects about the project, with each fact as a self-contained string.

Your response must be a valid JSON object with two fields:
- "summary": the summary string.
- "cool_facts": a list of cool fact strings.

README.md content:
{readme_content}
`
);

/**
 * Helper function to split a large paragraph into sentence chunks
 */
function splitParagraphIntoSentences(paragraph: string, maxChunkSize: number): string[] {
  const sentenceChunks: string[] = [];
  const sentences = paragraph.split(/(?<=[.!?])\s+/);
  let sentenceChunk = '';
  
  for (const sentence of sentences) {
    if (sentenceChunk.length + sentence.length + 1 <= maxChunkSize) {
      sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
    } else {
      if (sentenceChunk) {
        sentenceChunks.push(sentenceChunk);
      }
      sentenceChunk = sentence;
    }
  }
  
  if (sentenceChunk) {
    sentenceChunks.push(sentenceChunk);
  }
  
  return sentenceChunks;
}

/**
 * Helper function to process a paragraph that's too large
 */
function processLargeParagraph(
  paragraph: string,
  maxChunkSize: number,
  chunks: string[]
): string {
  if (paragraph.length > maxChunkSize) {
    const sentenceChunks = splitParagraphIntoSentences(paragraph, maxChunkSize);
    chunks.push(...sentenceChunks.slice(0, -1));
    return sentenceChunks.at(-1) || '';
  }
  return paragraph;
}

/**
 * Helper function to chunk large text into smaller pieces
 * Splits text at sentence boundaries to avoid breaking context
 */
function chunkText(text: string, maxChunkSize: number = 100000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  const paragraphs = text.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    const wouldExceedLimit = currentChunk.length + paragraph.length + 2 > maxChunkSize;
    
    if (wouldExceedLimit) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = processLargeParagraph(paragraph, maxChunkSize, chunks);
          } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks.length > 0 ? chunks : [text];
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (
        error.code === 'MODULE_NOT_FOUND' ||
        error.message?.includes("Can't resolve") ||
        error.message?.includes("fetch failed") ||
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("ENOTFOUND")
      ) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * OPTION 1: Google Gemini (Free tier available)
 * Get API key from: https://makersuite.google.com/app/apikey
 * 
 * Optimizations implemented:
 * - Increased timeout to 90 seconds for complex requests
 * - Limited max_output_tokens to prevent extremely long responses
 * - Uses gemini-1.5-flash (optimized for speed)
 * - Implements retry logic with exponential backoff
 * - Chunks large inputs to avoid timeout issues
 */
export async function summarizeWithGemini(
  readmeContent: string,
  proxyFetch?: ProxyFetchFunction
) {
  try {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is not set");
    }

    // Chunk large inputs to avoid timeout issues
    const chunks = chunkText(readmeContent, 100000); // 100k chars per chunk
    let contentToProcess: string;
    if (chunks.length > 1) {
      const truncatedMessage = `\n\n[... ${chunks.length - 1} more sections truncated for processing ...]`;
      contentToProcess = chunks[0] + truncatedMessage;
    } else {
      contentToProcess = readmeContent;
    }

    // Configure LLM with optimizations
    const llmConfig: any = {
      model: "gemini-1.5-flash", // Fast Flash model optimized for speed
      temperature: 0,
      apiKey: apiKey,
      maxOutputTokens: 1000, // Limit output to prevent extremely long responses
      timeout: 90000, // 90 seconds timeout (middle of 60-120 range)
    };

    // Use proxy fetch if provided (for corporate proxy environments)
    if (proxyFetch) {
      llmConfig.fetch = proxyFetch;
    }

    const llm = new ChatGoogleGenerativeAI(llmConfig);
    const prompt = createPrompt();
    
    // Bind withStructuredOutput to the model for structured JSON output
    const structuredLlm = llm.withStructuredOutput(summarySchema);

    const chain = RunnableSequence.from([
      (text: string) => ({ readme_content: text }),
      prompt,
      structuredLlm,
    ]);

    // Use retry logic with exponential backoff
    console.log(`Calling Gemini API with 90s timeout, maxOutputTokens: 1000, content length: ${contentToProcess.length} chars...`);
    return await retryWithBackoff(async () => {
      return await withTimeout(
        chain.invoke(contentToProcess),
        90000, // 90 seconds timeout
        'Gemini API call timed out after 90 seconds'
      );
    }, 3, 1000); // 3 retries with exponential backoff starting at 1 second

  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes("Can't resolve")) {
      throw new Error("Google Gemini package not installed. Run: npm install @langchain/google-genai --legacy-peer-deps");
    }
    
    // Check for timeout or connection issues - fallback to extraction
    if (error.message?.includes("timed out") || error.message?.includes("timeout")) {
      console.warn("Gemini API timed out after retries, falling back to extraction:", error.message);
      return summarizeWithExtraction(readmeContent);
    }
    
    // If fetch failed, it's likely a network/proxy issue - fallback to extraction
    if (error.message?.includes("fetch failed") || error.message?.includes("ECONNREFUSED") || error.message?.includes("ENOTFOUND")) {
      console.warn("Gemini API connection failed (likely proxy/network issue), falling back to extraction:", error.message);
      return summarizeWithExtraction(readmeContent);
    }
    
    // If all retries failed, fallback to extraction
    console.warn("Google Gemini summarization failed after retries, falling back to extraction:", error.message);
    return summarizeWithExtraction(readmeContent);
  }
}

/**
 * OPTION 2: Hugging Face (Free tier available)
 * Get API key from: https://huggingface.co/settings/tokens
 * Note: Requires @langchain/community package to be installed
 */
export async function summarizeWithHuggingFace(
  readmeContent: string,
  proxyFetch?: ProxyFetchFunction
) {
  // Use variable-based import path to prevent webpack static analysis
  const langchainPkg = "@langchain";
  const communityPkg = "/community";
  const hfPath = "/llms/hf";
  const modulePath = langchainPkg + communityPkg + hfPath;
  
  try {
    // @ts-ignore - dynamic import path
    const module = await import(modulePath);
    const { HuggingFaceInference } = module;
    
    const llm = new HuggingFaceInference({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      apiKey: process.env.HUGGINGFACE_API_KEY,
      temperature: 0,
    });

    const prompt = createPrompt();
    
    // Try to use withStructuredOutput if supported, otherwise fall back to manual parsing
    let structuredLlm;
    try {
      // Bind withStructuredOutput to the model for structured JSON output
      structuredLlm = llm.withStructuredOutput(summarySchema);
      
      const chain = RunnableSequence.from([
        (text: string) => ({ readme_content: text }),
        prompt,
        structuredLlm,
      ]);
      
      return await chain.invoke(readmeContent);
    } catch (error: any) {
      // If withStructuredOutput is not supported, fall back to manual parsing
      console.warn("withStructuredOutput not supported for HuggingFace, using manual parsing:", error.message);
      
      const formattedPrompt = await prompt.format({ readme_content: readmeContent });
    const response = await llm.invoke(formattedPrompt);
    
    // Parse JSON response
    try {
        const jsonRegex = /\{[\s\S]*\}/;
        const jsonMatch = jsonRegex.exec(response);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return summarySchema.parse(parsed);
      }
      throw new Error("No JSON found in response");
      } catch (parseError: unknown) {
      // Fallback: create a simple summary
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        console.warn("Failed to parse HuggingFace response:", errorMessage);
      return {
        summary: response.substring(0, 500),
        cool_facts: ["Generated using Hugging Face model"]
      };
      }
    }
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes("Can't resolve") || error.message?.includes("Cannot find module")) {
      // Fallback to extraction if package not installed
      console.warn("Hugging Face package not available. Falling back to extraction method.");
      return summarizeWithExtraction(readmeContent);
    }
    throw error;
  }
}

/**
 * OPTION 3: Simple Text Extraction (No AI, Free)
 * Extracts key information from README without using AI
 */
export function summarizeWithExtraction(readmeContent: string) {
  // Extract title (usually first # heading)
  const titleRegex = /^#\s+(.+)$/m;
  const titleMatch = titleRegex.exec(readmeContent);
  const title = titleMatch ? titleMatch[1] : "Project";

  // Extract description (usually after title or in first paragraph)
  const descriptionRegex = /(?:^#\s+.+\n\n)([\s\S]+?)(?:\n\n|$)/;
  const descriptionMatch = descriptionRegex.exec(readmeContent);
  const description = descriptionMatch ? descriptionMatch[1].trim().substring(0, 300) : "";

  // Extract features (look for ## Features or - list items)
  const featuresRegex = /##\s+Features?\s*\n([\s\S]*?)(?=\n##|$)/i;
  const featuresSection = featuresRegex.exec(readmeContent);
  const featuresList = featuresSection 
    ? featuresSection[1].match(/[-*]\s+(.+)/g)?.map(f => f.replace(/[-*]\s+/, "")) || []
    : [];

  // Extract badges/tech stack
  const badges = readmeContent.match(/!\[.*?\]\(.*?\)/g) || [];
  const techStack = readmeContent.match(/\[.*?\]\(.*?\)/g)?.slice(0, 5) || [];

  // Create summary
  const titlePart = title;
  const descriptionPart = description ? `: ${description}` : "";
  const featuresPart = featuresList.length > 0 
    ? ` Key features include ${featuresList.slice(0, 3).join(", ")}.` 
    : "";
  const summary = `${titlePart}${descriptionPart}${featuresPart}`;

  // Create cool facts
  const coolFacts: string[] = [];
  if (title) coolFacts.push(`Project name: ${title}`);
  if (featuresList.length > 0) {
    coolFacts.push(`Has ${featuresList.length} documented features`);
  }
  if (badges.length > 0) {
    coolFacts.push(`Includes ${badges.length} status badges`);
  }
  if (techStack.length > 0) {
    coolFacts.push(`Uses technologies: ${techStack.slice(0, 3).join(", ")}`);
  }
  
  // Add more generic facts if needed
  const lines = readmeContent.split('\n').length;
  if (lines > 50) coolFacts.push(`Comprehensive documentation with ${lines} lines`);
  
  const hasInstallation = readmeContent.toLowerCase().includes('install');
  if (hasInstallation) coolFacts.push('Includes installation instructions');

  return {
    summary: summary || "A GitHub project with documentation.",
    cool_facts: coolFacts.length >= 3 ? coolFacts : [
      ...coolFacts,
      "Open source project",
      "Available on GitHub",
      "Includes README documentation"
    ].slice(0, 7)
  };
}

/**
 * Main function that uses the provider specified in environment variable
 */
export async function summarizeReadme(
  readmeContent: string,
  proxyFetch?: ProxyFetchFunction
) {
  const provider = process.env.LLM_PROVIDER || "gemini";

  switch (provider.toLowerCase()) {
    case "gemini":
    case "google":
      if (!process.env.GOOGLE_API_KEY) {
        console.warn("GOOGLE_API_KEY environment variable is not set. Falling back to extraction method.");
        return summarizeWithExtraction(readmeContent);
      }
      return await summarizeWithGemini(readmeContent, proxyFetch);
    
    case "huggingface":
    case "hf":
      if (!process.env.HUGGINGFACE_API_KEY) {
        throw new Error("HUGGINGFACE_API_KEY environment variable is required");
      }
      return await summarizeWithHuggingFace(readmeContent, proxyFetch);
    
    case "extraction":
    case "simple":
    default:
      // No API key needed - uses simple text extraction
      return summarizeWithExtraction(readmeContent);
  }
}

