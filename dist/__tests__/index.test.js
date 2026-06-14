import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
jest.mock("@actions/core");
jest.mock("@actions/github");
import * as mainModule from "../index";
const mockGetInput = getInput;
const mockSetFailed = setFailed;
const mockGetOctokit = getOctokit;
describe("GitHub Action - Add Labels", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("successful label addition", () => {
        it("should add label to pull request when context is valid", async () => {
            const mockAddLabels = jest.fn().mockResolvedValue({});
            mockGetInput.mockImplementation((name) => {
                if (name === "gh-token")
                    return "fake-token";
                if (name === "label")
                    return "bug";
                return "";
            });
            mockGetOctokit.mockReturnValue({
                rest: {
                    issues: {
                        addLabels: mockAddLabels,
                    },
                },
            });
            Object.defineProperty(context, "payload", {
                value: {
                    pull_request: {
                        number: 123,
                    },
                },
                configurable: true,
            });
            Object.defineProperty(context, "repo", {
                value: {
                    owner: "test-owner",
                    repo: "test-repo",
                },
                configurable: true,
            });
            await mainModule.run();
            expect(mockAddLabels).toHaveBeenCalledWith({
                owner: "test-owner",
                repo: "test-repo",
                issue_number: 123,
                labels: ["bug"],
            });
            expect(mockSetFailed).not.toHaveBeenCalled();
        });
        it("should handle multiple labels", async () => {
            const mockAddLabels = jest.fn().mockResolvedValue({});
            mockGetInput.mockImplementation((name) => {
                if (name === "gh-token")
                    return "fake-token";
                if (name === "label")
                    return "bug,feature";
                return "";
            });
            mockGetOctokit.mockReturnValue({
                rest: {
                    issues: {
                        addLabels: mockAddLabels,
                    },
                },
            });
            Object.defineProperty(context, "payload", {
                value: {
                    pull_request: {
                        number: 456,
                    },
                },
                configurable: true,
            });
            Object.defineProperty(context, "repo", {
                value: {
                    owner: "test-owner",
                    repo: "test-repo",
                },
                configurable: true,
            });
            await mainModule.run();
            expect(mockAddLabels).toHaveBeenCalledWith({
                owner: "test-owner",
                repo: "test-repo",
                issue_number: 456,
                labels: ["bug,feature"],
            });
        });
    });
    describe("error handling", () => {
        it("should fail when no pull request is found in context", async () => {
            mockGetInput.mockImplementation((name) => {
                if (name === "gh-token")
                    return "fake-token";
                if (name === "label")
                    return "bug";
                return "";
            });
            mockGetOctokit.mockReturnValue({
                rest: {
                    issues: {
                        addLabels: jest.fn(),
                    },
                },
            });
            Object.defineProperty(context, "payload", {
                value: {
                    pull_request: null,
                },
                configurable: true,
            });
            await mainModule.run();
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining("No pull request found in the context"));
        });
        it("should fail when GitHub API call fails", async () => {
            const apiError = new Error("API Error: Permission denied");
            const mockAddLabels = jest.fn().mockRejectedValue(apiError);
            mockGetInput.mockImplementation((name) => {
                if (name === "gh-token")
                    return "fake-token";
                if (name === "label")
                    return "bug";
                return "";
            });
            mockGetOctokit.mockReturnValue({
                rest: {
                    issues: {
                        addLabels: mockAddLabels,
                    },
                },
            });
            Object.defineProperty(context, "payload", {
                value: {
                    pull_request: {
                        number: 789,
                    },
                },
                configurable: true,
            });
            Object.defineProperty(context, "repo", {
                value: {
                    owner: "test-owner",
                    repo: "test-repo",
                },
                configurable: true,
            });
            await mainModule.run();
            expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining("Action failed with error"));
        });
        it("should fail when required inputs are missing", async () => {
            mockGetInput.mockImplementation((name) => {
                if (name === "gh-token")
                    return "";
                if (name === "label")
                    return "bug";
                return "";
            });
            mockGetOctokit.mockImplementation(() => {
                throw new Error("Token is required");
            });
            Object.defineProperty(context, "payload", {
                value: {
                    pull_request: {
                        number: 999,
                    },
                },
                configurable: true,
            });
            Object.defineProperty(context, "repo", {
                value: {
                    owner: "test-owner",
                    repo: "test-repo",
                },
                configurable: true,
            });
            await mainModule.run();
            expect(mockSetFailed).toHaveBeenCalled();
        });
    });
    describe("input validation", () => {
        it("should use provided token from input", () => {
            mockGetInput.mockImplementation((name) => {
                if (name === "gh-token")
                    return "custom-token-123";
                return "";
            });
            mockGetInput("gh-token");
            expect(mockGetInput).toHaveBeenCalledWith("gh-token");
        });
        it("should use provided label from input", () => {
            mockGetInput.mockImplementation((name) => {
                if (name === "label")
                    return "enhancement";
                return "";
            });
            mockGetInput("label");
            expect(mockGetInput).toHaveBeenCalledWith("label");
        });
    });
});
