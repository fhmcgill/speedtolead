import { ENV } from "./env";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
//
// These mirror the OpenAI-style chat-completions shape the rest of the app
// already speaks (Message, InvokeParams, InvokeResult, etc). Keeping this
// surface unchanged means routers.ts, followupEngine.ts, plivoInbound.ts and
// webhooks.ts did not need to change at all when we swapped the underlying
// provider from Manus's Forge API to the Anthropic Claude API below.
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// ─────────────────────────────────────────────────────────────────────────────
// Anthropic Messages API wiring
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MAX_TOKENS = 1024;

const assertApiKey = () => {
  if (!ENV.anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Set it in your environment to enable AI replies."
    );
  }
};

type AnthropicTextBlock = { type: "text"; text: string };
type AnthropicImageBlock = {
  type: "image";
  source: { type: "url"; url: string };
};
type AnthropicContentBlock = AnthropicTextBlock | AnthropicImageBlock;
type AnthropicMessage = { role: "user" | "assistant"; content: AnthropicContentBlock[] };

const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

const partToText = (part: MessageContent): string => {
  if (typeof part === "string") return part;
  if (part.type === "text") return part.text;
  if (part.type === "image_url") return ""; // handled separately as an image block
  // file_url: Claude's API needs base64-encoded documents, not arbitrary remote
  // URLs, and nothing in this app currently sends file attachments to the LLM.
  // Surface it as a visible note rather than silently dropping it.
  return `[Attached file: ${part.file_url.url}]`;
};

const partToBlock = (part: MessageContent): AnthropicContentBlock => {
  if (typeof part === "string" || part.type !== "image_url") {
    return { type: "text", text: partToText(part) };
  }
  return { type: "image", source: { type: "url", url: part.image_url.url } };
};

/**
 * Anthropic has no "system" role inside `messages` -- system instructions are
 * a separate top-level `system` string, and only "user"/"assistant" roles are
 * allowed in the array. This pulls system messages out and folds anything
 * unexpected (tool/function messages -- unused by this app today) into a
 * plain user-role text block instead of throwing, so we degrade gracefully
 * if that ever changes.
 */
function toAnthropicMessages(messages: Message[]): {
  system: string | undefined;
  messages: AnthropicMessage[];
} {
  const systemParts: string[] = [];
  const out: AnthropicMessage[] = [];

  for (const message of messages) {
    const parts = ensureArray(message.content);

    if (message.role === "system") {
      systemParts.push(parts.map(partToText).join("\n"));
      continue;
    }

    if (message.role === "tool" || message.role === "function") {
      out.push({ role: "user", content: [{ type: "text", text: parts.map(partToText).join("\n") }] });
      continue;
    }

    out.push({
      role: message.role === "assistant" ? "assistant" : "user",
      content: parts.map(partToBlock),
    });
  }

  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    messages: out,
  };
}

function toAnthropicTools(tools: Tool[] | undefined) {
  if (!tools || tools.length === 0) return undefined;
  return tools.map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters ?? { type: "object", properties: {} },
  }));
}

function toAnthropicToolChoice(toolChoice: ToolChoice | undefined, tools: Tool[] | undefined) {
  if (!toolChoice || toolChoice === "none") return undefined;
  if (toolChoice === "auto") return { type: "auto" as const };

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error("tool_choice 'required' was provided but no tools were configured");
    }
    return { type: "any" as const };
  }

  const name = "name" in toolChoice ? toolChoice.name : toolChoice.function.name;
  return { type: "tool" as const, name };
}

function normalizeResponseFormat({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}): { type: "json_schema"; json_schema: JsonSchema } | undefined {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat?.type === "json_schema") {
    if (!explicitFormat.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return { type: "json_schema", json_schema: schema };
}

function mapStopReason(stopReason: string | null | undefined): string | null {
  switch (stopReason) {
    case "end_turn":
    case "stop_sequence":
      return "stop";
    case "max_tokens":
      return "length";
    case "tool_use":
      return "tool_calls";
    default:
      return stopReason ?? null;
  }
}

function toInvokeResult(data: any, structuredOutputToolName?: string): InvokeResult {
  const blocks: Array<any> = data.content ?? [];
  const textBlocks = blocks.filter(b => b.type === "text").map(b => b.text as string);
  const toolUseBlocks = blocks.filter(b => b.type === "tool_use");

  let content: string = textBlocks.join("\n");
  let toolCalls: ToolCall[] | undefined;

  if (structuredOutputToolName) {
    // Claude has no native structured-output mode, so when a json_schema
    // response_format/outputSchema was requested we forced a single tool call
    // matching that schema. The tool's `input` IS the structured answer --
    // surface it as a JSON string so callers can JSON.parse() it exactly like
    // they would an OpenAI json_schema response.
    const match = toolUseBlocks.find(b => b.name === structuredOutputToolName);
    if (match) content = JSON.stringify(match.input);
  } else if (toolUseBlocks.length > 0) {
    toolCalls = toolUseBlocks.map((b: any) => ({
      id: b.id,
      type: "function" as const,
      function: { name: b.name, arguments: JSON.stringify(b.input) },
    }));
  }

  return {
    id: data.id,
    created: Math.floor(Date.now() / 1000),
    model: data.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
          ...(toolCalls ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: mapStopReason(data.stop_reason),
      },
    ],
    usage: data.usage
      ? {
          prompt_tokens: data.usage.input_tokens ?? 0,
          completion_tokens: data.usage.output_tokens ?? 0,
          total_tokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        }
      : undefined,
  };
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    maxTokens,
    max_tokens,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const { system, messages: anthropicMessages } = toAnthropicMessages(messages);

  let anthropicTools = toAnthropicTools(tools);
  let anthropicToolChoice = toAnthropicToolChoice(toolChoice || tool_choice, tools);

  // Structured JSON output via the "forced tool call" trick (see toInvokeResult).
  let structuredOutputToolName: string | undefined;
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });
  if (normalizedResponseFormat && (!tools || tools.length === 0)) {
    structuredOutputToolName = normalizedResponseFormat.json_schema.name;
    anthropicTools = [
      {
        name: structuredOutputToolName,
        description: "Return the result matching the required schema.",
        input_schema: normalizedResponseFormat.json_schema.schema,
      },
    ];
    anthropicToolChoice = { type: "tool", name: structuredOutputToolName };
  }

  const payload: Record<string, unknown> = {
    model: ENV.anthropicModel,
    max_tokens: maxTokens ?? max_tokens ?? DEFAULT_MAX_TOKENS,
    messages: anthropicMessages,
  };

  if (system) payload.system = system;
  if (anthropicTools) payload.tools = anthropicTools;
  if (anthropicToolChoice) payload.tool_choice = anthropicToolChoice;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  const data = await response.json();
  return toInvokeResult(data, structuredOutputToolName);
}
