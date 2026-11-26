// 启动检查（2026-11-26 虎扑白屏率 5.41% 的修复任务）：
//   index.html 的 #app 里先放了启动画面（标题 + 进度条 +「正在进场」），游戏脚本全部加载完、首页画出来时被替换掉。
//   这个文件最先加载、最小，只负责「迟迟进不去」的时候告诉用户发生了什么，不让人对着一直不动的画面：
//   - 慢：6 秒提示「网络有点慢」，20 秒给「重新加载」按钮
//   - 脚本没下载下来、旧浏览器执行游戏脚本出错：直接说明原因 +「重新加载」
//   首页画好后 career-ui.js 会写 window.__gameReady = true，之后这里什么都不做。
//   用老写法（var / function），旧内核也能跑；只用 textContent / createElement，不写 HTML。
(function () {
  var failed = false;
  function boot() {
    var el = document.getElementById('boot');
    return el && document.body && document.body.contains(el) ? el : null; // 首页已经画出来就不在了
  }
  function show(text, retry) {
    var el = boot();
    if (!el || window.__gameReady) return;
    var m = document.getElementById('bootMsg');
    if (m) m.textContent = text;
    if (failed) el.className = 'boot fail';
    if (retry && !document.getElementById('bootRetry')) {
      var b = document.createElement('button');
      b.id = 'bootRetry';
      b.type = 'button';
      b.className = 'boot-retry';
      b.textContent = '重新加载';
      b.addEventListener('click', function () { location.reload(); });
      el.appendChild(b);
    }
  }
  // 游戏自己的文件和 index.html 在同一个目录；平台注入的脚本（SDK、监控）在别的目录，它们的报错不算游戏加载失败
  var dir = location.href.split('#')[0].split('?')[0].replace(/[^\/]*$/, '');
  var ours = function (url) { return typeof url === 'string' && url.indexOf(dir) === 0; };
  // 捕获阶段：脚本文件下载失败（这种 error 不冒泡）、游戏脚本执行出错都会到这里
  window.addEventListener('error', function (e) {
    if (window.__gameReady || failed) return; // 只显示第一个原因（文件没下载下来，后面的脚本跟着报错不改提示）
    var t = e && e.target;
    if (t && t.tagName === 'SCRIPT') {
      if (!ours(t.src)) return;
      failed = true;
      show('网络开小差了，有文件没下载下来', true);
    } else if ((!t || t === window) && ours(e.filename)) {
      failed = true;
      show('加载出错了，重新加载试试；还不行就换个浏览器或升级一下', true);
    }
  }, true);
  setTimeout(function () { if (!failed) show('网络有点慢，还在加载……', false); }, 6000);
  setTimeout(function () { if (!failed) show('加载时间有点长，可以重新加载试试', true); }, 20000);
})();
