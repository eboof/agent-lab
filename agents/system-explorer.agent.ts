// agents/system-explorer.agent.ts
// Demo agent that uses CLI tools to explore the system

import { BaseAgent } from "../server/agent-builder/agent.ts";
import { CLITool } from "../server/tools/implementations/cli-tool.ts";

export class SystemExplorerAgent extends BaseAgent {
  constructor() {
    super({
      name: "System Explorer",
      description: "Explores file system and runs shell commands safely",
      version: "1.0",
      systemPrompt: "You are a system exploration agent. You can run shell commands to explore the file system, check system info, and perform basic operations safely.",
      tools: [
        {
          "id": "cli-tool",
          "name": "cli-tool", 
          "type": "tool"
        }
      ],
      inputSchema: {
        "command": {
          "type": "string",
          "required": false,
          "description": "Single command to execute (e.g. 'ls -la')"
        },
        "commands": {
          "type": "array",
          "required": false,
          "description": "Array of commands to execute sequentially"
        },
        "task": {
          "type": "string",
          "required": false,
          "description": "High-level task description (e.g. 'explore current directory')"
        }
      },
      outputSchema: {
        "task_completed": {
          "type": "string",
          "required": true,
          "description": "Description of what was accomplished"
        },
        "commands_executed": {
          "type": "array",
          "required": true,
          "description": "List of commands that were run"
        },
        "results": {
          "type": "array",
          "required": true,
          "description": "Command execution results"
        },
        "summary": {
          "type": "string",
          "required": true,
          "description": "Summary of findings"
        }
      },
      dependencies: [],
      environmentVars: [],
      timeout: 0,
      retries: 0,
      memory: false
    });
  }

  protected async execute(input: Record<string, any>): Promise<any> {
    this.log("Starting system exploration with input:", input);
    
    try {
      let commandsToRun: string[] = [];
      
      // Determine what commands to run based on input
      if (input.command) {
        commandsToRun = [input.command];
      } else if (input.commands) {
        commandsToRun = Array.isArray(input.commands) ? input.commands : [input.commands];
      } else if (input.task) {
        // Interpret high-level tasks
        commandsToRun = this.interpretTask(input.task);
      } else {
        // Default exploration
        commandsToRun = ['pwd', 'ls -la', 'df -h'];
      }
      
      // Execute commands
      const results = [];
      const executedCommands = [];
      
      for (const cmdStr of commandsToRun) {
        try {
          const [command, ...args] = cmdStr.split(' ');
          const result = await CLITool.executeCommand(command, args);
          
          results.push({
            command: cmdStr,
            success: result.success,
            output: result.stdout,
            error: result.stderr,
            exitCode: result.exitCode,
            workingDirectory: result.workingDirectory,
            executionTime: result.executionTime
          });
          
          executedCommands.push(cmdStr);
          this.log(`Executed: ${cmdStr}`, result.success ? '✅' : '❌');
          
          // Add a small delay between commands to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error: any) {
          this.error("Command execution failed:", error.message);
          results.push({
            command: cmdStr,
            success: false,
            error: error.message,
            output: ''
          });
        }
      }
      
      // Generate summary
      const successfulCommands = results.filter(r => r.success).length;
      const summary = `Executed ${results.length} commands, ${successfulCommands} successful. ` +
                     `Working directory: ${results[0]?.workingDirectory || 'unknown'}`;
      
      const result = {
        task_completed: input.task || `Executed ${commandsToRun.length} shell commands`,
        commands_executed: executedCommands,
        results: results,
        summary: summary,
        timestamp: new Date().toISOString(),
        agent: this.config.name
      };
      
      this.log("System exploration completed successfully:", result);
      return result;
      
    } catch (error: any) {
      this.error("Execution failed:", error);
      throw error;
    }
  }

  private interpretTask(task: string): string[] {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('explore') || taskLower.includes('directory')) {
      return ['pwd', 'ls -la', 'find . -maxdepth 2 -type f'];
    } else if (taskLower.includes('system') || taskLower.includes('info')) {
      return ['uname -a', 'df -h', 'free -h', 'ps aux | head -10'];
    } else if (taskLower.includes('network')) {
      return ['ifconfig', 'netstat -an | head -10', 'ping -c 3 google.com'];
    } else if (taskLower.includes('disk') || taskLower.includes('space')) {
      return ['df -h', 'du -h . | head -10'];
    } else if (taskLower.includes('process')) {
      return ['ps aux', 'top -n 1 -b | head -15'];
    } else {
      // Default exploration
      return ['pwd', 'ls -la', 'whoami'];
    }
  }
}

// Default export for Agent-Lab runner compatibility
export default async function run(args: string[]) {
  const agent = new SystemExplorerAgent();
  return await agent.run(args);
}