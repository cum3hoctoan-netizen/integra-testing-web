#!/usr/bin/env node

/**
 * ==============================================================================
 * ANTIGRAVITY AUTO-DEPLOY TOOL: REACT / NEXT.JS TO GITHUB & VERCEL
 * ==============================================================================
 * Kịch bản tự động hóa triệt để chuỗi công việc đưa mã nguồn React/Next.js lên GitHub:
 * 1. Xóa sạch 100% thư mục ẩn .git (loại bỏ mọi lịch sử rác, file kẹt > 100MB).
 * 2. Khởi tạo lại repo Git mới tinh (git init).
 * 3. Tự động sinh file .gitignore an toàn chuẩn UTF-8 (loại bỏ node_modules, .next, .env, package-lock.json).
 * 4. Staging toàn bộ code, commit gốc ('Auto-deploy từ Antigravity'), gắn branch 'main', gán remote origin.
 * 5. Force push (git push -f -u origin main) đè sạch repo từ xa, đảm bảo thành công 100%.
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Màu sắc hiển thị Console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

function logStep(step, message) {
  console.log(`\n${colors.cyan}${colors.bold}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✔ ${message}${colors.reset}`);
}

function logWarn(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logError(message) {
  console.error(`${colors.red}✖ ${message}${colors.reset}`);
}

/**
 * Xóa an toàn thư mục trên mọi hệ điều hành (đặc biệt xử lý khóa file và thuộc tính Read-Only trên Windows)
 */
function removeGitDirectory(dirPath) {
  const gitDir = path.join(dirPath, '.git');
  if (!fs.existsSync(gitDir)) {
    logSuccess('Không phát hiện thư mục .git cũ. Sẵn sàng khởi tạo mới.');
    return;
  }

  logStep('1/5', 'Đang xóa triệt để thư mục .git cũ (dọn sạch file rác & file kẹt > 100MB)...');
  
  try {
    fs.rmSync(gitDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch (err) {
    if (process.platform === 'win32') {
      try {
        // Gỡ bỏ thuộc tính Read-only, System, Hidden nếu bị Windows chặn
        execSync(`attrib -r -s -h "${gitDir}\\*.*" /s /d`, { stdio: 'ignore', shell: true });
        execSync(`rmdir /s /q "${gitDir}"`, { stdio: 'ignore', shell: true });
      } catch (cmdErr) {
        throw new Error(`Không thể xóa thư mục .git: ${cmdErr.message}`);
      }
    } else {
      throw err;
    }
  }

  if (fs.existsSync(gitDir)) {
    throw new Error('Thư mục .git vẫn còn tồn tại sau khi xóa. Hãy kiểm tra xem có tiến trình nào đang chiếm giữ không.');
  }

  logSuccess('Đã xóa sạch thư mục .git và toàn bộ lịch sử cache.');
}

/**
 * Khởi tạo Git repository mới và cấu hình cơ bản
 */
function initFreshGit(workDir) {
  logStep('2/5', 'Khởi tạo Git repository mới tinh...');
  execSync('git init', { cwd: workDir, stdio: 'pipe' });

  // Kiểm tra cấu hình user.name và user.email để tránh lỗi commit bị dừng
  try {
    execSync('git config user.name', { cwd: workDir, stdio: 'pipe' });
  } catch {
    logWarn('Chưa có git user.name toàn cục, đang cấu hình mặc định tạm thời...');
    execSync('git config user.name "Antigravity Deployer"', { cwd: workDir });
  }

  try {
    execSync('git config user.email', { cwd: workDir, stdio: 'pipe' });
  } catch {
    logWarn('Chưa có git user.email toàn cục, đang cấu hình mặc định tạm thời...');
    execSync('git config user.email "deploy@antigravity.local"', { cwd: workDir });
  }

  // Tắt autocrlf để tránh cảnh báo CRLF/LF trên Windows
  try {
    execSync('git config core.autocrlf false', { cwd: workDir, stdio: 'ignore' });
  } catch {}

  logSuccess('Khởi tạo Git repository thành công.');
}

/**
 * Sinh file .gitignore tối ưu chuẩn UTF-8 (tránh lỗi mã hóa UTF-16LE gây commit nhầm file nặng)
 */
function generateSafeGitignore(workDir) {
  logStep('3/5', 'Đang tạo file .gitignore an toàn tuyệt đối cho React/Next.js...');

  const gitignoreContent = `# ==============================================================================
# TỰ ĐỘNG SINH BỞI ANTIGRAVITY - CHUẨN TỐI ƯU CHO REACT / NEXT.JS
# ==============================================================================

# 1. Thư mục phụ thuộc & File nặng (Bảo vệ tuyệt đối khỏi lỗi 100MB của GitHub)
node_modules/
.pnp
.pnp.js
package-lock.json
yarn.lock
pnpm-lock.yaml

# 2. Thư mục Build & Cache của Next.js / React
.next/
out/
build/
dist/
*.tsbuildinfo
next-env.d.ts

# 3. Biến môi trường & Khóa bảo mật bí mật
.env
.env*.local
.env.local
.env.development.local
.env.test.local
.env.production.local

# 4. Vercel & Cloud CLI
.vercel/

# 5. File hệ thống & Trình soạn thảo
.DS_Store
Thumbs.db
desktop.ini
.vscode/
.idea/

# 6. Nhật ký lỗi (Logs)
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
`;

  const gitignorePath = path.join(workDir, '.gitignore');
  fs.writeFileSync(gitignorePath, gitignoreContent, { encoding: 'utf8' });
  logSuccess('Đã tạo file .gitignore chuẩn UTF-8 (loại trừ node_modules, .next, .env, package-lock.json).');
}

/**
 * Thực hiện stage, commit và đổi branch sang main
 */
function stageAndCommit(workDir, repoUrl) {
  logStep('4/5', 'Thêm mã nguồn, tạo commit gốc và liên kết GitHub Remote...');

  // Stage tất cả các file hợp lệ (bỏ qua những gì trong .gitignore)
  execSync('git add .', { cwd: workDir, stdio: 'inherit' });

  // Commit với thông điệp chuẩn
  try {
    execSync('git commit -m "Auto-deploy từ Antigravity"', { cwd: workDir, stdio: 'inherit' });
  } catch (e) {
    // Trường hợp không có file nào thay đổi
    logWarn('Không có file mới để commit hoặc toàn bộ file đã được commit.');
  }

  // Chuyển sang nhánh main
  execSync('git branch -M main', { cwd: workDir, stdio: 'pipe' });

  // Thiết lập remote origin
  try {
    execSync('git remote remove origin', { cwd: workDir, stdio: 'ignore' });
  } catch {}
  execSync(`git remote add origin ${repoUrl}`, { cwd: workDir, stdio: 'pipe' });

  logSuccess(`Đã cấu hình nhánh 'main' và liên kết remote origin: ${repoUrl}`);
}

/**
 * Thực hiện Force Push lên GitHub
 */
function forcePush(workDir) {
  logStep('5/5', 'Thực hiện Push ép buộc (git push -f -u origin main)...');

  try {
    // Git push in tiến trình qua stderr, nên ta dùng stdio: 'inherit' để hiển thị trực quan
    execSync('git push -f -u origin main', { cwd: workDir, stdio: 'inherit' });
    logSuccess('Mã nguồn đã được đẩy lên GitHub thành công rực rỡ!');
  } catch (error) {
    throw new Error(`Đẩy code thất bại: ${error.message}. Vui lòng kiểm tra quyền truy cập repository trên GitHub hoặc thông tin xác thực SSH/Personal Access Token.`);
  }
}

/**
 * Hàm điều phối chính
 */
export async function deployToGitHub(repoUrl, targetDir = process.cwd()) {
  const startTime = Date.now();

  console.log(`\n${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.green}${colors.bold}   🚀 ANTIGRAVITY ONE-CLICK GITHUB & VERCEL DEPLOYER  ${colors.reset}`);
  console.log(`${colors.bold}======================================================${colors.reset}`);
  console.log(`📂 Thư mục làm việc : ${colors.cyan}${targetDir}${colors.reset}`);
  console.log(`🔗 GitHub Repo      : ${colors.cyan}${repoUrl}${colors.reset}`);

  if (!repoUrl || typeof repoUrl !== 'string') {
    logError('Lỗi: Bạn chưa cung cấp đường dẫn GitHub repository!');
    console.log(`Cách dùng: node deploy-github.mjs <https://github.com/tai-khoan/ten-repo.git>`);
    process.exit(1);
  }

  // Chuẩn hóa định dạng repo URL
  const cleanRepoUrl = repoUrl.trim();

  try {
    removeGitDirectory(targetDir);
    initFreshGit(targetDir);
    generateSafeGitignore(targetDir);
    stageAndCommit(targetDir, cleanRepoUrl);
    forcePush(targetDir);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n${colors.bold}======================================================${colors.reset}`);
    console.log(`${colors.green}${colors.bold}   🎉 HOÀN THÀNH XUẤT SẮC TRONG ${elapsed} GIÂY!           ${colors.reset}`);
    console.log(`${colors.bold}======================================================${colors.reset}`);
    console.log(`\n📌 Mã nguồn sạch 100% đã sẵn sàng trên GitHub:`);
    console.log(`👉 ${colors.cyan}${cleanRepoUrl}${colors.reset}\n`);
    console.log(`👉 Bước tiếp theo:`);
    console.log(`   1. Truy cập Vercel Dashboard: https://vercel.com/new`);
    console.log(`   2. Chọn repo vừa đẩy để Import.`);
    console.log(`   3. Nhấn "Deploy" là web của bạn sẽ hoạt động trực tiếp ngay lập tức!\n`);

    return {
      success: true,
      repoUrl: cleanRepoUrl,
      elapsedSeconds: elapsed
    };
  } catch (error) {
    console.log(`\n${colors.red}${colors.bold}======================================================${colors.reset}`);
    console.log(`${colors.red}${colors.bold}   ❌ QUY TRÌNH DEPLOY GẶP SỰ CỐ!                    ${colors.reset}`);
    console.log(`${colors.red}${colors.bold}======================================================${colors.reset}`);
    logError(error.message);
    process.exit(1);
  }
}

// Chạy trực tiếp từ CLI nếu được gọi qua lệnh: node deploy-github.mjs <repoUrl>
const args = process.argv.slice(2);
if (process.argv[1] && (process.argv[1].endsWith('deploy-github.mjs') || process.argv[1].endsWith('deploy-github.js'))) {
  if (args.length > 0) {
    deployToGitHub(args[0], process.cwd());
  } else {
    // Nếu không truyền tham số, kiểm tra xem git remote hiện tại có link nào không
    try {
      const existingRemote = execSync('git remote get-url origin', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (existingRemote) {
        console.log(`${colors.yellow}Phát hiện link remote origin cũ: ${existingRemote}${colors.reset}`);
        deployToGitHub(existingRemote, process.cwd());
      } else {
        logError('Vui lòng cung cấp link GitHub repository! Ví dụ: node deploy-github.mjs https://github.com/user/repo.git');
      }
    } catch {
      logError('Vui lòng cung cấp link GitHub repository! Ví dụ: node deploy-github.mjs https://github.com/user/repo.git');
    }
  }
}
