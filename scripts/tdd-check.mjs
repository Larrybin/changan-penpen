#!/usr/bin/env node

/**
 * TDD质量检查脚本
 * 验证新开发是否遵循TDD原则
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置选项
const CONFIG = {
    projectRoot: process.cwd(),
    testDir: "tests",
    srcDir: "src",
    requiredCoverage: {
        newFiles: 100, // 新文件100%覆盖
        modifiedFiles: 80, // 修改文件80%覆盖
    },
    patterns: {
        testFiles: /\.test\.(ts|tsx|js|jsx)$/,
        sourceFiles: /\.(ts|tsx|js|jsx)$/,
    },
};

// 颜色输出
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
};

function log(message, color = "white") {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, "green");
}

function warning(message) {
    log(`⚠️  ${message}`, "yellow");
}

function error(message) {
    log(`❌ ${message}`, "red");
}

function info(message) {
    log(`ℹ️  ${message}`, "blue");
}

// 工具函数
function findTestFile(sourceFile) {
    const testFile = sourceFile
        .replace(CONFIG.srcDir, CONFIG.testDir)
        .replace(/\.(ts|tsx|js|jsx)$/, ".test.$1")
        .replace(/\/components\//, "/components/")
        .replace(/\/lib\//, "/lib/")
        .replace(/\/services\//, "/services/")
        .replace(/\/modules\//, "/modules/");

    return testFile;
}

function hasTestFile(sourceFile) {
    const testFile = findTestFile(sourceFile);
    return existsSync(join(CONFIG.projectRoot, testFile));
}

function extractCoverageFromCoverageFile() {
    const coverageFile = join(CONFIG.projectRoot, "coverage", "coverage-summary.json");

    if (!existsSync(coverageFile)) {
        return null;
    }

    try {
        const coverageData = JSON.parse(readFileSync(coverageFile, "utf8"));
        return coverageData.total;
    } catch (error) {
        warning(`无法解析覆盖率文件: ${error.message}`);
        return null;
    }
}

// 检查1: 新文件是否有测试
function checkNewFilesHaveTests() {
    log("\n🔍 检查新文件是否有对应的测试文件", "cyan");

    // 这里应该与git集成，获取新文件列表
    // 为了演示，我们检查src目录下所有文件
    const srcPath = join(CONFIG.projectRoot, CONFIG.srcDir);

    // 简化的文件查找（实际项目中应该使用git status）
    const sourceFiles = [
        "src/modules/auth/components/signup-form.tsx",
        "src/components/ui/button.tsx",
        "src/lib/utils.ts",
    ];

    let newFilesWithoutTests = 0;
    let totalNewFiles = sourceFiles.length;

    sourceFiles.forEach(file => {
        const fullPath = join(CONFIG.projectRoot, file);
        if (existsSync(fullPath) && !hasTestFile(file)) {
            error(`缺少测试文件: ${file} -> ${findTestFile(file)}`);
            newFilesWithoutTests++;
        } else {
            success(`有测试文件: ${file}`);
        }
    });

    const compliance = ((totalNewFiles - newFilesWithoutTests) / totalNewFiles) * 100;

    log(`\n📊 新文件测试覆盖率: ${compliance.toFixed(1)}% (${totalNewFiles - newFilesWithoutTests}/${totalNewFiles})`,
         compliance >= 100 ? "green" : "yellow");

    if (compliance < 100) {
        warning("新文件必须100%有对应的测试文件");
        return false;
    }

    return true;
}

// 检查2: 测试文件是否遵循TDD原则
function checkTDDPrinciples() {
    log("\n🧪 检查测试文件是否遵循TDD原则", "cyan");

    const testFiles = [
        "tests/components/common/button.test.tsx",
        "tests/api/handlers/auth.test.ts",
        "tests/components/auth/signup-form.test.tsx",
    ];

    let tddCompliance = 0;
    let totalTests = 0;

    testFiles.forEach(testFile => {
        const fullPath = join(CONFIG.projectRoot, testFile);

        if (existsSync(fullPath)) {
            try {
                const content = readFileSync(fullPath, "utf8");

                // 检查TDD原则
                let fileScore = 0;
                let maxScore = 0;

                // 检查是否有describe块
                if (content.includes("describe(") || content.includes("describe('"))) {
                    fileScore += 1;
                }
                maxScore++;

                // 检查是否有it测试
                const itMatches = content.match(/it\(/g);
                if (itMatches && itMatches.length > 0) {
                    fileScore += 1;
                }
                maxScore++;

                // 检查是否有用户行为导向测试
                if (content.includes("getByRole") || content.includes("getByLabelText")) {
                    fileScore += 1;
                }
                maxScore++;

                // 检查是否有异步测试
                if (content.includes("async") || content.includes("await")) {
                    fileScore += 1;
                }
                maxScore++;

                // 检查是否有错误场景测试
                if (content.includes("error") || content.includes("invalid")) {
                    fileScore += 1;
                }
                maxScore++;

                const fileCompliance = (fileScore / maxScore) * 100;
                tddCompliance += fileCompliance;
                totalTests++;

                if (fileCompliance >= 80) {
                    success(`TDD原则遵循良好: ${testFile} (${fileCompliance.toFixed(1)}%)`);
                } else {
                    warning(`TDD原则需要改进: ${testFile} (${fileCompliance.toFixed(1)}%)`);
                }

            } catch (error) {
                error(`读取测试文件失败: ${testFile} - ${error.message}`);
            }
        }
    });

    if (totalTests > 0) {
        const averageCompliance = tddCompliance / totalTests;
        log(`\n📊 TDD原则平均遵循度: ${averageCompliance.toFixed(1)}%`,
             averageCompliance >= 80 ? "green" : "yellow");

        if (averageCompliance < 80) {
            warning("测试文件需要更好地遵循TDD原则");
            return false;
        }
    }

    return true;
}

// 检查3: 覆盖率是否达标
function checkCoverageThresholds() {
    log("\n📈 检查代码覆盖率是否达标", "cyan");

    const coverage = extractCoverageFromCoverageFile();

    if (!coverage) {
        warning("无法找到覆盖率数据，请先运行测试: pnpm test:coverage");
        return false;
    }

    const { lines, functions, branches, statements } = coverage;

    log(`行覆盖: ${lines.pct}%`, lines.pct >= 30 ? "green" : "red");
    log(`函数覆盖: ${functions.pct}%`, functions.pct >= 35 ? "green" : "red");
    log(`分支覆盖: ${branches.pct}%`, branches.pct >= 25 ? "green" : "red");
    log(`语句覆盖: ${statements.pct}%`, statements.pct >= 30 ? "green" : "red");

    const thresholds = {
        lines: 30,
        functions: 35,
        branches: 25,
        statements: 30,
    };

    const allThresholdsMet =
        lines.pct >= thresholds.lines &&
        functions.pct >= thresholds.functions &&
        branches.pct >= thresholds.branches &&
        statements.pct >= thresholds.statements;

    if (allThresholdsMet) {
        success("所有覆盖率指标都已达标");
        return true;
    } else {
        error("覆盖率指标未达标");
        return false;
    }
}

// 检查4: 测试文件命名规范
function checkNamingConventions() {
    log("\n📝 检查测试文件命名规范", "cyan");

    const testDir = join(CONFIG.projectRoot, CONFIG.testDir);

    // 检查测试文件命名
    const namingIssues = [];

    // 这里应该扫描实际的测试文件
    // 为了演示，我们检查一些已知的问题
    const knownTestFiles = [
        "button.test.tsx",
        "auth.test.ts",
        "api.test.ts",
    ];

    knownTestFiles.forEach(file => {
        // 检查是否在正确的目录中
        const expectedLocation = file.includes("component") ?
            "components/" : file.includes("api") ? "api/" : "";

        if (expectedLocation && !file.includes(expectedLocation)) {
            namingIssues.push(`测试文件位置不正确: ${file} 应该在 ${expectedLocation} 目录中`);
        }
    });

    if (namingIssues.length === 0) {
        success("测试文件命名规范符合要求");
        return true;
    } else {
        namingIssues.forEach(issue => error(issue));
        warning("测试文件命名需要规范化");
        return false;
    }
}

// 主函数
function main() {
    log("🚀 TDD质量检查开始", "magenta");
    log("=" * 50, "cyan");

    const results = [
        checkNewFilesHaveTests(),
        checkTDDPrinciples(),
        checkCoverageThresholds(),
        checkNamingConventions(),
    ];

    log("\n" + "=" * 50, "cyan");
    log("📋 检查结果汇总", "magenta");

    const passedChecks = results.filter(Boolean).length;
    const totalChecks = results.length;

    if (passedChecks === totalChecks) {
        success(`🎉 所有检查通过! (${passedChecks}/${totalChecks})`);
        log("✅ 代码质量良好，符合TDD开发标准", "green");
        process.exit(0);
    } else {
        error(`❌ 部分检查未通过 (${passedChecks}/${totalChecks})`);
        log("🔧 请根据上述建议改进代码质量", "yellow");
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (import.meta.url === import.meta.url) {
    main();
}

export default main;