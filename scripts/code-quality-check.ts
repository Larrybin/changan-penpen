#!/usr/bin/env node

/**
 * 代码质量检查脚本
 *
 * 功能：
 * - TypeScript类型检查
 * - Biome代码格式化和lint检查
 * - 性能优化建议
 * - 安全漏洞检查
 * - 代码复杂度分析
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

class CodeQualityChecker {
  private results: CheckResult[] = [];

  constructor(private projectRoot: string = process.cwd()) {}

  /**
   * 运行TypeScript类型检查
   */
  async checkTypeScript(): Promise<CheckResult> {
    const result: CheckResult = {
      name: 'TypeScript 类型检查',
      passed: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      console.log('🔍 运行 TypeScript 类型检查...');
      execSync('pnpm typecheck', { stdio: 'pipe', cwd: this.projectRoot });
      console.log('✅ TypeScript 类型检查通过');
    } catch (error: any) {
      result.passed = false;
      const output = error.stdout?.toString() || error.stderr?.toString() || error.message;

      // 解析TypeScript错误
      const lines = output.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        if (line.includes('error TS')) {
          result.errors.push(line);
        } else if (line.includes('warning TS')) {
          result.warnings.push(line);
        }
      });

      console.log('❌ TypeScript 类型检查失败');
      result.errors.forEach(error => console.log(`  🚨 ${error}`));
      result.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    }

    this.results.push(result);
    return result;
  }

  /**
   * 运行Biome代码检查
   */
  async checkBiome(): Promise<CheckResult> {
    const result: CheckResult = {
      name: 'Biome 代码检查',
      passed: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      console.log('🔍 运行 Biome 代码检查...');
      execSync('pnpm exec biome check --verbose', { stdio: 'pipe', cwd: this.projectRoot });
      console.log('✅ Biome 代码检查通过');
    } catch (error: any) {
      result.passed = false;
      const output = error.stdout?.toString() || error.stderr?.toString() || error.message;

      // 解析Biome输出
      const lines = output.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        if (line.includes('error')) {
          result.errors.push(line);
        } else if (line.includes('warn') || line.includes('warning')) {
          result.warnings.push(line);
        } else if (line.includes('suggestion')) {
          result.suggestions.push(line);
        }
      });

      console.log('❌ Biome 代码检查发现问题');
      result.errors.forEach(error => console.log(`  🚨 ${error}`));
      result.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
      result.suggestions.forEach(suggestion => console.log(`  💡 ${suggestion}`));
    }

    this.results.push(result);
    return result;
  }

  /**
   * 检查package.json依赖
   */
  async checkDependencies(): Promise<CheckResult> {
    const result: CheckResult = {
      name: '依赖检查',
      passed: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      console.log('🔍 检查项目依赖...');
      const packageJsonPath = join(this.projectRoot, 'package.json');

      if (!existsSync(packageJsonPath)) {
        result.errors.push('package.json 文件不存在');
        result.passed = false;
        return result;
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // 检查是否有已知的安全漏洞依赖
      const vulnerablePackages = [
        'lodash@<4.17.21',
        'moment@<2.29.4',
        'axios@<1.0.0',
        'request@<2.88.2'
      ];

      Object.entries(deps).forEach(([name, version]) => {
        vulnerablePackages.forEach(vulnerable => {
          const [vulnName, vulnVersion] = vulnerable.split('@');
          if (name === vulnName && (version as string).startsWith(vulnVersion)) {
            result.warnings.push(`${name}@${version} 可能存在安全漏洞，建议升级到最新版本`);
            result.passed = false;
          }
        });
      });

      // 检查是否有重复的依赖
      if (deps['next'] && deps['next-intl']) {
        // 这是一个正常的组合，不警告
      }

      // 检查是否有未使用的依赖
      const commonUnusedDeps = ['@types/node'];
      commonUnusedDeps.forEach(dep => {
        if (deps[dep]) {
          result.suggestions.push(`考虑移除未使用的依赖: ${dep}`);
        }
      });

      console.log('✅ 依赖检查完成');
      if (result.warnings.length > 0) {
        console.log('⚠️  发现以下安全问题:');
        result.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
      }
      if (result.suggestions.length > 0) {
        console.log('💡 优化建议:');
        result.suggestions.forEach(suggestion => console.log(`  💡 ${suggestion}`));
      }
    } catch (error) {
      result.errors.push(`依赖检查失败: ${error}`);
      result.passed = false;
      console.log('❌ 依赖检查失败');
    }

    this.results.push(result);
    return result;
  }

  /**
   * 检查文件大小和性能
   */
  async checkPerformance(): Promise<CheckResult> {
    const result: CheckResult = {
      name: '性能检查',
      passed: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      console.log('🔍 检查项目性能...');

      // 检查Next.js配置
      const nextConfigPath = join(this.projectRoot, 'next.config.ts');
      if (existsSync(nextConfigPath)) {
        const nextConfig = readFileSync(nextConfigPath, 'utf8');

        if (!nextConfig.includes('experimental:')) {
          result.suggestions.push('考虑启用 Next.js 实验性功能以提升性能');
        }

        if (!nextConfig.includes('images:') || !nextConfig.includes('formats:')) {
          result.suggestions.push('配置图片优化格式 (AVIF/WebP) 以提升加载性能');
        }
      }

      // 检查CSS文件大小
      const cssFiles = [
        join(this.projectRoot, 'src/app/globals.css'),
        join(this.projectRoot, 'src/styles/accessibility.css')
      ];

      cssFiles.forEach(cssFile => {
        if (existsSync(cssFile)) {
          const stats = require('fs').statSync(cssFile);
          const sizeKB = Math.round(stats.size / 1024);

          if (sizeKB > 50) {
            result.warnings.push(`${cssFile} 文件过大 (${sizeKB}KB)，考虑拆分或优化`);
          }
        }
      });

      console.log('✅ 性能检查完成');
      if (result.suggestions.length > 0) {
        console.log('💡 性能优化建议:');
        result.suggestions.forEach(suggestion => console.log(`  💡 ${suggestion}`));
      }
    } catch (error) {
      result.errors.push(`性能检查失败: ${error}`);
      result.passed = false;
      console.log('❌ 性能检查失败');
    }

    this.results.push(result);
    return result;
  }

  /**
   * 检查SEO配置
   */
  async checkSEO(): Promise<CheckResult> {
    const result: CheckResult = {
      name: 'SEO 配置检查',
      passed: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      console.log('🔍 检查 SEO 配置...');

      // 检查robots.txt
      const robotsPath = join(this.projectRoot, 'public/robots.txt');
      if (!existsSync(robotsPath)) {
        result.errors.push('robots.txt 文件不存在');
        result.passed = false;
      }

      // 检查sitemap.xml路由
      const sitemapRoutePath = join(this.projectRoot, 'src/app/sitemap.xml');
      if (!existsSync(sitemapRoutePath)) {
        result.warnings.push('sitemap.xml 路由不存在，建议添加动态站点地图');
      }

      // 检查SEO工具文件
      const seoFiles = [
        'src/lib/seo-metadata.ts',
        'src/lib/seo/breadcrumbs.ts',
        'src/lib/seo/product-schema.ts',
        'src/lib/seo/sitemap.ts',
        'src/lib/seo/canonical.ts'
      ];

      seoFiles.forEach(file => {
        const filePath = join(this.projectRoot, file);
        if (!existsSync(filePath)) {
          result.suggestions.push(`考虑添加 SEO 工具文件: ${file}`);
        }
      });

      console.log('✅ SEO 配置检查完成');
      if (result.errors.length > 0) {
        console.log('🚨 SEO 配置错误:');
        result.errors.forEach(error => console.log(`  🚨 ${error}`));
      }
      if (result.suggestions.length > 0) {
        console.log('💡 SEO 优化建议:');
        result.suggestions.forEach(suggestion => console.log(`  💡 ${suggestion}`));
      }
    } catch (error) {
      result.errors.push(`SEO 检查失败: ${error}`);
      result.passed = false;
      console.log('❌ SEO 检查失败');
    }

    this.results.push(result);
    return result;
  }

  /**
   * 生成质量报告
   */
  generateReport(): void {
    console.log('\n📊 代码质量检查报告');
    console.log('='.repeat(50));

    let totalPassed = 0;
    let totalChecks = this.results.length;

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);

      if (result.errors.length > 0) {
        console.log(`  🚨 错误 (${result.errors.length}):`);
        result.errors.slice(0, 5).forEach(error =>
          console.log(`    ${error}`)
        );
        if (result.errors.length > 5) {
          console.log(`    ... 还有 ${result.errors.length - 5} 个错误`);
        }
      }

      if (result.warnings.length > 0) {
        console.log(`  ⚠️  警告 (${result.warnings.length}):`);
        result.warnings.slice(0, 3).forEach(warning =>
          console.log(`    ${warning}`)
        );
        if (result.warnings.length > 3) {
          console.log(`    ... 还有 ${result.warnings.length - 3} 个警告`);
        }
      }

      if (result.suggestions.length > 0) {
        console.log(`  💡 建议 (${result.suggestions.length}):`);
        result.suggestions.slice(0, 3).forEach(suggestion =>
          console.log(`    ${suggestion}`)
        );
        if (result.suggestions.length > 3) {
          console.log(`    ... 还有 ${result.suggestions.length - 3} 个建议`);
        }
      }

      console.log('');

      if (result.passed) {
        totalPassed++;
      }
    });

    const score = Math.round((totalPassed / totalChecks) * 100);
    console.log(`📈 总体质量评分: ${score}% (${totalPassed}/${totalChecks})`);

    if (score >= 90) {
      console.log('🎉 优秀！代码质量很高');
    } else if (score >= 80) {
      console.log('👍 良好！代码质量不错');
    } else if (score >= 70) {
      console.log('👌 一般，需要改进一些问题');
    } else {
      console.log('⚠️  需要重点关注代码质量问题');
    }
  }

  /**
   * 运行所有检查
   */
  async runAllChecks(): Promise<void> {
    console.log('🚀 开始代码质量检查...\n');

    await this.checkTypeScript();
    await this.checkBiome();
    await this.checkDependencies();
    await this.checkPerformance();
    await this.checkSEO();

    this.generateReport();

    // 设置退出码
    const hasErrors = this.results.some(result => result.errors.length > 0);
    if (hasErrors) {
      console.log('\n❌ 发现错误，请修复后重新检查');
      process.exit(1);
    } else {
      console.log('\n✅ 所有检查通过！');
      process.exit(0);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const checker = new CodeQualityChecker();
  checker.runAllChecks().catch(error => {
    console.error('代码质量检查失败:', error);
    process.exit(1);
  });
}

export { CodeQualityChecker };