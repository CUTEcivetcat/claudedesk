/**
 * Tool definitions in Anthropic's tool use format.
 * These are sent to the AI so it knows what tools are available.
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file. Use this to view code, configuration, or any text file.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path to the file' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write or overwrite a file. This will create parent directories if they don\'t exist.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path where the file should be written' },
        content: { type: 'string', description: 'The complete file content to write' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_directory',
    description: 'List the contents of a directory. Use this to explore project structure.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Absolute path to the directory' }
      },
      required: ['path']
    }
  },
  {
    name: 'search_files',
    description: 'Search for a text pattern across files in a directory. Uses grep internally.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pattern: { type: 'string', description: 'Text or regex pattern to search for' },
        path: { type: 'string', description: 'Directory to search in (absolute path)' }
      },
      required: ['pattern', 'path']
    }
  },
  {
    name: 'run_command',
    description: 'Execute a shell command. The user will be asked to approve dangerous commands.',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: 'The shell command to execute' },
        cwd: { type: 'string', description: 'Working directory for the command' }
      },
      required: ['command']
    }
  }
]

export type ToolName = 'read_file' | 'write_file' | 'list_directory' | 'search_files' | 'run_command'
