// server/tools/implementations/cli-tool.ts
// CLI execution tool for agents to run shell commands

import { spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

export interface CLIResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  workingDirectory: string;
  executionTime: number;
}

export class CLITool {
  private static workingDirectory: string = process.cwd();
  private static maxExecutionTime: number = 30000; // 30 seconds max

  /**
   * Execute a shell command safely with proper error handling and security restrictions
   */
  static async executeCommand(
    command: string, 
    args: string[] = [],
    options: {
      cwd?: string;
      timeout?: number;
      allowUnsafe?: boolean;
    } = {}
  ): Promise<CLIResponse> {
    const startTime = Date.now();
    const cwd = options.cwd || this.workingDirectory;
    const timeout = options.timeout || this.maxExecutionTime;

    // Security: Block dangerous commands unless explicitly allowed
    if (!options.allowUnsafe && this.isDangerousCommand(command)) {
      return {
        success: false,
        stdout: '',
        stderr: `Command '${command}' is blocked for security reasons`,
        exitCode: -1,
        command: `${command} ${args.join(' ')}`,
        workingDirectory: cwd,
        executionTime: Date.now() - startTime
      };
    }

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Timeout handler
      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          success: false,
          stdout,
          stderr: stderr + '\n[Command timed out]',
          exitCode: -1,
          command: `${command} ${args.join(' ')}`,
          workingDirectory: cwd,
          executionTime: Date.now() - startTime
        });
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code || 0,
          command: `${command} ${args.join(' ')}`,
          workingDirectory: cwd,
          executionTime: Date.now() - startTime
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          stdout,
          stderr: error.message,
          exitCode: -1,
          command: `${command} ${args.join(' ')}`,
          workingDirectory: cwd,
          executionTime: Date.now() - startTime
        });
      });
    });
  }

  /**
   * Common shell commands with safety wrappers
   */

  // List directory contents
  static async ls(path: string = '.', options: string[] = []): Promise<CLIResponse> {
    return this.executeCommand('ls', [...options, path]);
  }

  // Change working directory (for subsequent commands)
  static async cd(path: string): Promise<CLIResponse> {
    const fullPath = path.startsWith('/') ? path : `${this.workingDirectory}/${path}`;
    
    try {
      // Verify directory exists
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        this.workingDirectory = fullPath;
        return {
          success: true,
          stdout: `Changed directory to: ${fullPath}`,
          stderr: '',
          exitCode: 0,
          command: `cd ${path}`,
          workingDirectory: fullPath,
          executionTime: 0
        };
      } else {
        return {
          success: false,
          stdout: '',
          stderr: `Not a directory: ${path}`,
          exitCode: 1,
          command: `cd ${path}`,
          workingDirectory: this.workingDirectory,
          executionTime: 0
        };
      }
    } catch (error: any) {
      return {
        success: false,
        stdout: '',
        stderr: error.message,
        exitCode: 1,
        command: `cd ${path}`,
        workingDirectory: this.workingDirectory,
        executionTime: 0
      };
    }
  }

  // Get current working directory
  static async pwd(): Promise<CLIResponse> {
    return {
      success: true,
      stdout: this.workingDirectory,
      stderr: '',
      exitCode: 0,
      command: 'pwd',
      workingDirectory: this.workingDirectory,
      executionTime: 0
    };
  }

  // Display file contents
  static async cat(filePath: string): Promise<CLIResponse> {
    return this.executeCommand('cat', [filePath]);
  }

  // Search file contents
  static async grep(pattern: string, filePath: string, options: string[] = []): Promise<CLIResponse> {
    return this.executeCommand('grep', [...options, pattern, filePath]);
  }

  // Make HTTP requests
  static async curl(url: string, options: string[] = []): Promise<CLIResponse> {
    // Add basic safety for curl
    const safeOptions = options.filter(opt => !opt.includes('--'));
    return this.executeCommand('curl', ['-s', '--max-time', '10', ...safeOptions, url]);
  }

  // Find files
  static async find(path: string = '.', options: string[] = []): Promise<CLIResponse> {
    return this.executeCommand('find', [path, ...options]);
  }

  // Show disk usage
  static async du(path: string = '.', options: string[] = ['-h']): Promise<CLIResponse> {
    return this.executeCommand('du', [...options, path]);
  }

  // Show free space
  static async df(options: string[] = ['-h']): Promise<CLIResponse> {
    return this.executeCommand('df', options);
  }

  // Show running processes
  static async ps(options: string[] = ['aux']): Promise<CLIResponse> {
    return this.executeCommand('ps', options);
  }

  // Show network connections
  static async netstat(options: string[] = ['-an']): Promise<CLIResponse> {
    return this.executeCommand('netstat', options);
  }

  /**
   * Security helper to identify potentially dangerous commands
   */
  private static isDangerousCommand(command: string): boolean {
    const dangerousCommands = [
      'rm', 'rmdir', 'del', 'delete',
      'mv', 'move', 'cp', 'copy',
      'chmod', 'chown', 'chgrp',
      'sudo', 'su', 'passwd',
      'mkfs', 'fdisk', 'parted',
      'shutdown', 'reboot', 'halt',
      'kill', 'killall', 'pkill',
      'crontab', 'systemctl', 'service',
      'iptables', 'ufw', 'firewall-cmd',
      'dd', 'mount', 'umount'
    ];

    const cmd = command.toLowerCase().trim();
    return dangerousCommands.some(dangerous => cmd.includes(dangerous));
  }

  /**
   * Get current working directory for agents
   */
  static getCurrentWorkingDirectory(): string {
    return this.workingDirectory;
  }

  /**
   * Set working directory
   */
  static setWorkingDirectory(path: string): void {
    this.workingDirectory = path;
  }
}