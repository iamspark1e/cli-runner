<h1 align='center'>CLI Runner</h1>

<br />
<p align='center'>[Experimental Project] 可执行文件运行管理GUI</p>
<br />

## 免责声明

本开源项目及其开发者在法律允许的最大范围内，不对以下情况负责：

1. 使用本程序调用的外部程序所造成的后果与本程序无关，本程序不对执行的后果做任何保证。

2. 本项目为实验性项目，程序运行可能因Bug造成影响，开发者不对其负责。用户应自行承担使用本项目的风险。

3. 本程序仅用于实验使用，不允许用于适用于使用者所在地的任何非法用途。

用户在使用本项目时，应遵守适用法律和法规，不得将本项目用于任何非法或滥用的用途。用户应谨慎使用本项目，自行承担与使用本项目相关的风险和责任。开发者对于因使用本项目而导致的任何损失或损害概不负责。

请在使用本项目之前详细阅读并理解此免责声明。如果您不同意或不接受本免责声明的任何部分，请立即停止使用本项目。

## DISCLAIMER

To the fullest extent permitted by law, this open-source project and its developers are not responsible for the following:

1. Any consequences resulting from the use of external programs called by this program are unrelated to this program, and this program makes no guarantees regarding the outcomes of such execution.

2. This project is experimental, and the program's operation may be affected by bugs. The developers are not responsible for any issues caused by it. Users are solely responsible for the risks associated with using this project.

3. This program is intended for experimental use only and is not to be used for any illegal purposes in the user's jurisdiction.

Users are expected to comply with applicable laws and regulations when using this project and are prohibited from using it for any unlawful or abusive purposes. Users should exercise caution when using this project and assume full responsibility for any risks or liabilities associated with its use. The developers are not liable for any losses or damages incurred as a result of using this project.

Please read and understand this disclaimer in full before using this project. If you do not agree with or accept any part of this disclaimer, please cease using this project immediately.

## 兼容性

- [x] Windows
- [ ] Linux
- [ ] MacOS

## Todo List

### 兼容

- [ ] 适配跨平台（kill进程部分）

### 功能

- [ ] 程序启动自动运行
- [x] 导入从程序导出的配置（backup.json => BaseDirectory.Home/.cli-runner.config.json），并解决冲突？
- [ ] 自动检测Task是否有效（可执行程序是否存在、运行上下文是否存在）
- [ ] 增加运行前警告⚠弹窗
- [ ] 增加About弹窗，展示依赖及其版本号

### CI/CD

- [x] Github Action自动编译多平台安装程序

### Programming

- [ ] 更好的PID管理模式？
- [ ] 更好的错误输出以替代程序里的console.log?

## Project Development

### Bootstrap

> Node.js is required.

```
npm install
npm run tauri dev
```

> According to issue (https://github.com/tauri-apps/tauri/issues/4174), build under ARM is not supported yet.

### About Tauri

#### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
