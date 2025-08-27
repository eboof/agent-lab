// RAG Bridge - Connects TypeScript Agent-Lab server to Python RAG system
// This runs the Python RAG API as a subprocess and provides TypeScript interfaces

import { spawn, ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class RAGBridge {
  private ragProcess: ChildProcess | null = null;
  private isReady = false;
  private readonly ragPort = 8000;
  private readonly ragScript = join(__dirname, "..", "server", "api.py");

  async startRAGServer(): Promise<void> {
    if (this.ragProcess) {
      console.log("⚠️ RAG server already running");
      return;
    }

    console.log("🚀 Starting Python RAG server...");
    
    try {
      // Start the Python RAG server as a subprocess
      this.ragProcess = spawn("python", [this.ragScript], {
        cwd: join(__dirname, ".."),
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, PYTHONPATH: join(__dirname, "..") }
      });

      this.ragProcess.stdout?.on("data", (data) => {
        const output = data.toString().trim();
        if (output.includes("Application startup complete")) {
          this.isReady = true;
          console.log("✅ Python RAG server is ready on port", this.ragPort);
        }
        console.log(`🐍 RAG: ${output}`);
      });

      this.ragProcess.stderr?.on("data", (data) => {
        console.error(`❌ RAG Error: ${data.toString()}`);
      });

      this.ragProcess.on("close", (code) => {
        console.log(`📴 RAG server exited with code ${code}`);
        this.ragProcess = null;
        this.isReady = false;
      });

      // Wait for server to be ready (max 30 seconds)
      const maxWait = 30000;
      const checkInterval = 500;
      let waited = 0;

      while (!this.isReady && waited < maxWait) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }

      if (!this.isReady) {
        throw new Error("RAG server failed to start within 30 seconds");
      }

    } catch (error) {
      console.error("❌ Failed to start RAG server:", error);
      throw error;
    }
  }

  async stopRAGServer(): Promise<void> {
    if (this.ragProcess) {
      console.log("🛑 Stopping Python RAG server...");
      this.ragProcess.kill();
      this.ragProcess = null;
      this.isReady = false;
    }
  }

  async query(question: string, model: string = "gpt-4o-mini", k: number = 3) {
    if (!this.isReady) {
      throw new Error("RAG server is not ready. Call startRAGServer() first.");
    }

    try {
      const response = await fetch(`http://127.0.0.1:${this.ragPort}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, model, k }),
      });

      if (!response.ok) {
        throw new Error(`RAG query failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ RAG query error:", error);
      throw error;
    }
  }

  async getModels() {
    if (!this.isReady) {
      throw new Error("RAG server is not ready. Call startRAGServer() first.");
    }

    try {
      const response = await fetch(`http://127.0.0.1:${this.ragPort}/models`);
      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("❌ Get models error:", error);
      throw error;
    }
  }

  async healthCheck() {
    if (!this.isReady) {
      return { status: "not_ready" };
    }

    try {
      const response = await fetch(`http://127.0.0.1:${this.ragPort}/health`);
      if (response.ok) {
        return await response.json();
      }
      return { status: "error", message: `HTTP ${response.status}` };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  }

  isServerReady(): boolean {
    return this.isReady;
  }
}

// Singleton instance
export const ragBridge = new RAGBridge();

// Graceful shutdown
process.on("SIGTERM", () => ragBridge.stopRAGServer());
process.on("SIGINT", () => ragBridge.stopRAGServer());