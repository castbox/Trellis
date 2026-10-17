# 当前验收状态

## 结论

本次实现尚未完成全部验收。Task 保持 `in_progress`。Issue #47 保持打开。PR #50 保持草稿。
当前候选不得合并、发布或作为下游正式采用的来源。

公开摘要模块已提供 `GitCandidateContent`。该能力在一次操作内复用实际仓库中不可变 blob 的内容摘要。
每次调用仍独立检查完整 commit OID、路径、类型、mode 和对象可用性。
调用方仍独立比较期望摘要和 Task/Delivery 事实。原文件系统入口保持兼容。

## 已取得的证据

- 原 #48 能力复验通过 44/44。证据：`old-capability-acceptance.json`。
- 正常恢复与历史流程通过 28/28。证据：`benchmark/public-fixture-results.json`。
- 正常生产提交及 CI 登记提交的完整 hook 均通过：2828 项通过，1 项跳过。lint、类型检查、Python 3.9 编译和构建通过。
- [标准 CI 39011401447](https://github.com/castbox/Trellis/actions/runs/39011401447) 通过，验证提交 `520b8d8c863845b15c7eec488ccfcbacda21253c`。
- 候选安装通过全部 7 项检查。两个包的 1013 个文件字节与权限一致。证据：`candidate-install-verification.json` 和 `candidate-pack-verification.json`。候选包尚未发布。

## 性能验收仍未通过

两种环境分别保留结果。后一次测量不覆盖前一次失败。

|环境|原绝对检查|同环境配对检查|结论|
|---|---:|---:|---|
|原 Mac，显式进程策略|183/188|21/24|失败|
|预先登记的 Ubuntu cohort 1|181/188|22/24|失败|

Mac 失败项涉及 128 路径耗时。原始数值见 `benchmark/paired-controlled-policy-results.md`。
Ubuntu 完整执行全部 6 个场景和 12 个 phase。7 个绝对门槛未通过；2 个配对门槛未通过。
128 路径混合内容的 manual 改善 3.52%，query2 改善 4.40%，均低于 5% 要求。
10001 路径混合内容的 manual 为 2.273483433 秒，超过原上限 2.168253252 秒。
展示数值不用于取整放行。完整原值见 `benchmark/ci-cohort1/`。

Ubuntu 的全部精确输入、84 个 pyc OID、进程范围和资源检查通过。
独立复算的 188 个绝对检查和 24 个配对检查与原 artifact 完全一致。
这是完整性能失败，不能归类为测量工具或 setup 失败。
原 artifact、92 个正式结果和 3348 个原始进程记录均已保全。
没有重跑、补样本、更换 runner、放宽门槛或丢弃失败。

## 后续责任边界

现有诊断未发现当前摘要模块内有实证支持、足以补齐剩余门槛的必要优化。
此前诊断中的摘要组件观察约为 50–59 ms，完整恢复约为 717–731 ms。
两组观察不是嵌套 profiler，不能直接相减并归因。

Guru 原调用方可评估四个 commit 角色的元数据批读及 managed runtime 的重复进程启动。
这些建议属于下游 owner，尚未实施，也不构成收益承诺。
四角色检查只影响 manual，不能单独补齐 query2 的失败。
本次没有修改 Guru 正式源码，也没有修改下游 Task 或 Issue。

一次额外的嵌套诊断已记录于 `nested-owner-diagnostic.{md,json}`。
该诊断只使用当前 Mac 的临时区间观察器，没有原验收计数和 RSS 观察器。
方法外耗时在该次观察中低于原上限。因此，不能宣称上游独立达标在数值上绝无可能。
该诊断不证明门槛通过，也不覆盖 Ubuntu 或 Mac 的原始失败。
首次仪器未记录区间的失败、修复和无业务导入探针均已保留。

下游 #589 继续负责匹配安装、正式集成和原 Task Completion。
后续必须取得全部冻结门槛的有效通过证据，才能合并和发布。
发布后必须完成下载资产、校验和与隔离安装复验，才能关闭 #47 和归档本 Task。

生产源码提交：`69033a662d68701610f09caa97f1d292bccd1076`。
PR：https://github.com/castbox/Trellis/pull/50。
