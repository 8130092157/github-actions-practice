import { getInput, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import * as mainModule from "../index";
jest.mock("@actions/core");
jest.mock("@actions/github");
const mockGetInput = getInput;
const mockSetFailed = setFailed;
const mockGetOctokit = getOctokit;
describe("GitHub Action - SonarQube PR Comments", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });
    describe("fetchSonarQubeResults", () => {
        it("should fetch SonarQube component data successfully", async () => {
            const mockComponent = {
                key: "my-project",
                measures: [
                    { key: "alert_status", value: "OK" },
                    { key: "bugs", value: "2" },
                    { key: "vulnerabilities", value: "0" },
                    { key: "code_smells", value: "5" },
                    { key: "coverage", value: "85" },
                ],
            };
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ component: mockComponent }),
            });
            const result = await mainModule.fetchSonarQubeResults("https://sonarcloud.io", "my-project", "token123", "my-org");
            expect(result).toEqual(mockComponent);
        });
        it("should handle API errors gracefully", async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                statusText: "Unauthorized",
            });
            await expect(mainModule.fetchSonarQubeResults("https://sonarcloud.io", "my-project", "invalid-token")).rejects.toThrow("SonarQube API error");
        });
    });
    describe("successful comment posting", () => {
        it("should post SonarQube results as PR comment", async () => {
            const mockCreateComment = jest.fn().mockResolvedValue({});
            mockGetInput.mockImplementation((name) => {
                if (name === "gh-token")
                    return "gh-token-123";
                if (name === "sonarqube-token")
                    return "sonar-token-123";
                if (name === "sonarqube-host-url")
                    return "https://sonarcloud.io";
                if (name === "sonarqube-project-key")
                    return "my-project";
                if (name === "sonarqube-organization")
                    return "my-org";
                return "";
            });
            const mockComponent = {
                key: "my-project",
                measures: [
                    { key: "alert_status", value: "OK" },
                    { key: "bugs", value: "0" },
                    { key: "vulnerabilities", value: "0" },
                    { key: "code_smells", value: "3" },
                    { key: "coverage", value: "90" },
                    { key: "duplicated_lines_density", value: "2" },
                    { key: "maintainability_rating", value: "A" },
                    { key: "reliability_rating", value: "A" },
                    { key: "security_rating", value: "A" },
                ],
            };
            global.fetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ component: mockComponent }),
            });
            mockGetOctokit.mockReturnValue({
                rest: {
                    issues: {
                        createComment: mockCreateComment,
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
            expect(mockCreateComment).toHaveBeenCalledWith({
                owner: "test-owner",
                repo: "test-repo",
                issue_number: 123,
                body: expect.stringContaining("SonarQube Analysis Results"),
            });
            expect(mockSetFailed).not.toHaveBeenCalled();
        });
    });
    describe("error handling", () => {
        it("should fail when no pull request is found", async () => {
            mockGetInput.mockImplementation((name) => {
                if (name === "gh-token")
                    return "token";
                if (name === "sonarqube-token")
                    return "token";
                if (name === "sonarqube-project-key")
                    return "project";
                return "";
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
        it("should fail when SonarQube API call fails", async () => {
            mockGetInput.mockImplementation((name) => {
                if (name === "gh-token")
                    return "gh-token";
                if (name === "sonarqube-token")
                    return "sonar-token";
                if (name === "sonarqube-host-url")
                    return "https://sonarcloud.io";
                if (name === "sonarqube-project-key")
                    return "my-project";
                return "";
            });
            global.fetch.mockRejectedValue(new Error("Network error"));
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
    });
    describe("input validation", () => {
        it("should read all required SonarQube inputs", () => {
            mockGetInput.mockImplementation((name) => {
                if (name === "gh-token")
                    return "gh-token-123";
                if (name === "sonarqube-token")
                    return "sonar-token-123";
                if (name === "sonarqube-host-url")
                    return "https://sonarcloud.io";
                if (name === "sonarqube-project-key")
                    return "my-project-key";
                if (name === "sonarqube-organization")
                    return "my-organization";
                return "";
            });
            expect(mockGetInput).toHaveBeenCalledWith("gh-token");
            expect(mockGetInput).toHaveBeenCalledWith("sonarqube-token");
            expect(mockGetInput).toHaveBeenCalledWith("sonarqube-project-key");
        });
    });
});
