// server/api/agents.test.ts
// Unit tests for Agent API endpoints

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import fs from "fs";
import path from "path";
import agentsRouter from "./agents.ts";

// Mock filesystem operations
vi.mock("fs");
const mockFs = vi.mocked(fs);

// Test app setup
const app = express();
app.use(express.json());
app.use("/api/agents", agentsRouter);

describe("Agent API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/agents/list", () => {
    it("should return empty array when agents directory doesn't exist", async () => {
      mockFs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .get("/api/agents/list")
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it("should return list of agent files", async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        "stock-analyst.json",
        "email-bot.yaml", 
        "research-assistant.yml",
        "readme.txt" // should be filtered out
      ] as any);

      const response = await request(app)
        .get("/api/agents/list")
        .expect(200);

      expect(response.body).toEqual([
        { id: "stock-analyst", file: "stock-analyst.json" },
        { id: "email-bot", file: "email-bot.yaml" },
        { id: "research-assistant", file: "research-assistant.yml" }
      ]);
    });

    it("should handle filesystem errors gracefully", async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const response = await request(app)
        .get("/api/agents/list")
        .expect(500);

      expect(response.body).toHaveProperty("error", "Failed to list agents");
    });
  });

  describe("GET /api/agents/load/:id", () => {
    it("should load existing agent file", async () => {
      const agentContent = JSON.stringify({
        name: "Stock Analyst",
        role: "Financial analysis specialist"
      });

      mockFs.existsSync
        .mockReturnValueOnce(false) // .json doesn't exist
        .mockReturnValueOnce(true);  // .yaml exists
      mockFs.readFileSync.mockReturnValue(agentContent);

      const response = await request(app)
        .get("/api/agents/load/stock-analyst")
        .expect(200);

      expect(response.body).toEqual({
        id: "stock-analyst",
        file: "stock-analyst.yaml",
        content: agentContent
      });
    });

    it("should return 404 for non-existent agent", async () => {
      mockFs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .get("/api/agents/load/non-existent")
        .expect(404);

      expect(response.body).toHaveProperty("error", "Agent 'non-existent' not found");
    });

    it("should handle file read errors", async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error("File corrupted");
      });

      const response = await request(app)
        .get("/api/agents/load/corrupted-agent")
        .expect(500);

      expect(response.body).toHaveProperty("error", "Failed to load agent");
    });
  });

  describe("POST /api/agents/save", () => {
    it("should save new agent successfully", async () => {
      const agentData = {
        name: "Test Agent",
        role: "Testing specialist"
      };

      mockFs.writeFileSync.mockImplementation(() => {});

      const response = await request(app)
        .post("/api/agents/save")
        .send({ id: "test-agent", content: agentData })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        id: "test-agent",
        file: expect.stringContaining("test-agent.json")
      });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("test-agent.json"),
        JSON.stringify(agentData, null, 2),
        "utf-8"
      );
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/agents/save")
        .send({ id: "test-agent" }) // missing content
        .expect(400);

      expect(response.body).toHaveProperty("error", "Missing id or content");
    });

    it("should handle file write errors", async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error("Disk full");
      });

      const response = await request(app)
        .post("/api/agents/save")
        .send({ id: "test-agent", content: { name: "Test" } })
        .expect(500);

      expect(response.body).toHaveProperty("error", "Failed to save agent");
    });
  });

  describe("DELETE /api/agents/delete/:id", () => {
    it("should delete existing agent", async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {});

      const response = await request(app)
        .delete("/api/agents/delete/test-agent")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        id: "test-agent"
      });

      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining("test-agent.json")
      );
    });

    it("should return 404 for non-existent agent", async () => {
      mockFs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .delete("/api/agents/delete/non-existent")
        .expect(404);

      expect(response.body).toHaveProperty("error", "Agent 'non-existent' not found");
    });

    it("should handle file deletion errors", async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const response = await request(app)
        .delete("/api/agents/delete/protected-agent")
        .expect(500);

      expect(response.body).toHaveProperty("error", "Failed to delete agent");
    });
  });

  describe("Integration Tests", () => {
    it("should create, load, and delete agent in sequence", async () => {
      const agentData = {
        name: "Integration Test Agent",
        role: "Testing the full workflow"
      };

      // Mock successful operations
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(agentData));
      mockFs.unlinkSync.mockImplementation(() => {});

      // Create agent
      await request(app)
        .post("/api/agents/save")
        .send({ id: "integration-test", content: agentData })
        .expect(200);

      // Load agent
      const loadResponse = await request(app)
        .get("/api/agents/load/integration-test")
        .expect(200);

      expect(loadResponse.body).toHaveProperty("content", JSON.stringify(agentData));

      // Delete agent
      await request(app)
        .delete("/api/agents/delete/integration-test")
        .expect(200);
    });
  });

  describe("Error Handling", () => {
    it("should not crash server on unexpected errors", async () => {
      // Simulate catastrophic failure
      mockFs.existsSync.mockImplementation(() => {
        throw new Error("System failure");
      });

      const response = await request(app)
        .get("/api/agents/list")
        .expect(500);

      expect(response.body).toHaveProperty("error");
    });

    it("should validate agent IDs for path traversal", async () => {
      const maliciousId = "../../../etc/passwd";
      
      mockFs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .get(`/api/agents/load/${encodeURIComponent(maliciousId)}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      
      // Ensure the malicious path wasn't used
      expect(mockFs.existsSync).not.toHaveBeenCalledWith(
        expect.stringContaining("/etc/passwd")
      );
    });
  });
});

// Test utilities
export const createMockAgent = (overrides = {}) => ({
  name: "Test Agent",
  role: "Testing specialist",
  tools: ["yahoo-finance"],
  model: "claude-3-5-sonnet-20241022",
  systemPrompt: "You are a test agent",
  inputSchema: {
    query: { type: "string", required: true }
  },
  outputSchema: {
    result: { type: "string", required: true }
  },
  ...overrides
});

export const createMockAgentFile = (id: string, content: any) => ({
  id,
  file: `${id}.json`,
  content: JSON.stringify(content, null, 2)
});