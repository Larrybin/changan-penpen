/**
 * 质量门禁配置
 *
 * 定义不同场景下的质量检查标准和策略
 */

export const qualityGates = {
  // 基础门禁 - 适用于日常开发
  basic: {
    name: "基础质量门禁",
    description: "日常开发的基础质量检查",
    riskThreshold: 0.3,
    checks: {
      biome: {
        enabled: true,
        errorOnWarnings: false,
        rules: {
          complexity: { level: "warn" },
          performance: { level: "error" },
          style: { level: "error" },
          suspicious: { level: "error" }
        }
      },
      typescript: {
        enabled: true,
        strict: false,
        noImplicitAny: true
      },
      tests: {
        enabled: false,
        coverage: false
      },
      build: {
        enabled: true,
        skipOnDocsOnly: true
      }
    }
  },

  // 标准门禁 - 适用于功能开发
  standard: {
    name: "标准质量门禁",
    description: "功能开发的标准质量检查",
    riskThreshold: 0.6,
    checks: {
      biome: {
        enabled: true,
        errorOnWarnings: true,
        rules: {
          complexity: { level: "error" },
          performance: { level: "error" },
          style: { level: "error" },
          suspicious: { level: "error" }
        }
      },
      typescript: {
        enabled: true,
        strict: true,
        noImplicitAny: true,
        noImplicitReturns: true
      },
      tests: {
        enabled: true,
        coverage: {
          enabled: true,
          thresholds: {
            lines: 70,
            functions: 70,
            branches: 60,
            statements: 70
          }
        }
      },
      build: {
        enabled: true,
        skipOnDocsOnly: false
      },
      security: {
        enabled: true,
        level: "basic"
      }
    }
  },

  // 严格门禁 - 适用于生产发布
  strict: {
    name: "严格质量门禁",
    description: "生产发布的严格质量检查",
    riskThreshold: 0.8,
    checks: {
      biome: {
        enabled: true,
        errorOnWarnings: true,
        rules: {
          complexity: { level: "error" },
          performance: { level: "error" },
          style: { level: "error" },
          suspicious: { level: "error" },
          correctness: { level: "error" }
        }
      },
      typescript: {
        enabled: true,
        strict: true,
        noImplicitAny: true,
        noImplicitReturns: true,
        noUnusedLocals: true,
        noUnusedParameters: true
      },
      tests: {
        enabled: true,
        coverage: {
          enabled: true,
          thresholds: {
            lines: 80,
            functions: 80,
            branches: 70,
            statements: 80
          }
        }
      },
      build: {
        enabled: true,
        skipOnDocsOnly: false,
        validateSize: true
      },
      security: {
        enabled: true,
        level: "comprehensive"
      },
      performance: {
        enabled: true,
        analyzeBundle: true,
        checkLighthouse: false // CI中不运行Lighthouse
      }
    }
  },

  // 文档门禁 - 适用于文档变更
  docs: {
    name: "文档质量门禁",
    description: "文档变更的专门检查",
    riskThreshold: 0.2,
    checks: {
      biome: {
        enabled: true,
        errorOnWarnings: false,
        files: ["**/*.md", "**/*.mdx"]
      },
      typescript: {
        enabled: false
      },
      tests: {
        enabled: false
      },
      build: {
        enabled: false
      },
      docs: {
        enabled: true,
        checkLinks: true,
        checkSpelling: false,
        validateStructure: true
      }
    }
  }
};

// 智能门禁选择器
export function selectQualityGate(context) {
  const {
    changedFiles,
    branchName,
    commitType,
    environment = 'development',
    urgency = 'normal'
  } = context;

  // 根据变更类型选择门禁
  if (changedFiles.every(file => file.match(/\.(md|mdx)$/))) {
    return qualityGates.docs;
  }

  // 根据分支选择门禁
  if (branchName?.includes('release/') || branchName?.includes('hotfix/')) {
    return qualityGates.strict;
  }

  // 根据提交类型选择门禁
  if (commitType?.includes('feat') || commitType?.includes('fix')) {
    return qualityGates.standard;
  }

  // 根据环境选择门禁
  if (environment === 'production') {
    return qualityGates.strict;
  }

  // 根据紧急程度选择门禁
  if (urgency === 'high') {
    return qualityGates.basic;
  }

  // 默认使用标准门禁
  return qualityGates.standard;
}

// 质量评分计算器
export function calculateQualityScore(results, gate) {
  const weights = {
    biome: 0.2,
    typescript: 0.25,
    tests: 0.3,
    build: 0.15,
    security: 0.05,
    performance: 0.05
  };

  let totalScore = 0;
  let totalWeight = 0;

  for (const [checkName, result] of Object.entries(results)) {
    const weight = weights[checkName] || 0;
    if (weight > 0 && gate.checks[checkName]?.enabled) {
      const score = result.success ? 1 : 0;
      totalScore += score * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// 质量报告生成器
export function generateQualityReport(results, gate, context) {
  const score = calculateQualityScore(results, gate);
  const passed = score >= 0.8; // 80% 及格线

  return {
    gate: gate.name,
    score: Math.round(score * 100),
    passed,
    summary: {
      totalChecks: Object.keys(results).length,
      passedChecks: Object.values(results).filter(r => r.success).length,
      failedChecks: Object.values(results).filter(r => !r.success).length
    },
    details: results,
    recommendations: generateRecommendations(results, gate, score),
    context: {
      ...context,
      riskScore: context.riskScore || 0,
      executionTime: context.executionTime || 0
    }
  };
}

function generateRecommendations(results, gate, score) {
  const recommendations = [];

  if (score < 0.6) {
    recommendations.push("🚨 质量评分较低，建议优先修复关键问题");
  }

  const failedChecks = Object.entries(results).filter(([_, result]) => !result.success);
  if (failedChecks.length > 0) {
    recommendations.push(`🔧 修复失败的检查项: ${failedChecks.map(([name]) => name).join(', ')}`);
  }

  // 检查特定建议
  if (results.tests && !results.tests.success && gate.checks.tests?.coverage?.enabled) {
    recommendations.push("📊 提高测试覆盖率以满足要求");
  }

  if (results.biome && !results.biome.success) {
    recommendations.push("🎨 修复代码风格和潜在问题");
  }

  if (results.typescript && !results.typescript.success) {
    recommendations.push("🔍 修复TypeScript类型错误");
  }

  if (results.build && !results.build.success) {
    recommendations.push("🏗️ 修复构建错误");
  }

  if (score >= 0.8) {
    recommendations.push("✅ 质量检查通过，可以继续部署");
  }

  return recommendations;
}

export default {
  qualityGates,
  selectQualityGate,
  calculateQualityScore,
  generateQualityReport
};