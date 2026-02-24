#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成《Codex 改动存档与回滚指南（VS Code 中文版）》PDF。
说明：
- 使用 reportlab 生成 UTF-8 中文 PDF。
- 仅新增文档，不修改现有业务代码。
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    ListFlowable,
    ListItem,
)


def build_pdf(output_path: Path) -> None:
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleCN",
        parent=styles["Title"],
        fontName="STSong-Light",
        fontSize=22,
        leading=28,
        spaceAfter=12,
    )
    h1_style = ParagraphStyle(
        "H1CN",
        parent=styles["Heading1"],
        fontName="STSong-Light",
        fontSize=16,
        leading=22,
        spaceBefore=10,
        spaceAfter=6,
    )
    h2_style = ParagraphStyle(
        "H2CN",
        parent=styles["Heading2"],
        fontName="STSong-Light",
        fontSize=13,
        leading=18,
        spaceBefore=8,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "BodyCN",
        parent=styles["BodyText"],
        fontName="STSong-Light",
        fontSize=10.5,
        leading=16,
        spaceAfter=3,
    )
    code_style = ParagraphStyle(
        "CodeCN",
        parent=body_style,
        fontName="STSong-Light",
        backColor=colors.whitesmoke,
        leftIndent=8,
        rightIndent=8,
        borderColor=colors.lightgrey,
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=3,
        spaceAfter=6,
    )

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="Codex 改动存档与回滚指南（VS Code 中文版）",
        author="Project Lysh",
    )

    story = []

    story.append(Paragraph("Codex 改动存档与回滚指南（VS Code 中文版）", title_style))
    story.append(
        Paragraph(
            "目标：把 Codex 的改动管理做成“像《上古卷轴 / 辐射》一样好用的快速存档 + 读档”。<br/>"
            "重点：你可以频繁保存临时进度，但不污染正式版本号和发布历史。",
            body_style,
        )
    )
    story.append(Spacer(1, 6))

    story.append(Paragraph("1. 先说结论：推荐双轨制", h1_style))
    story.append(
        Paragraph(
            "轨道 A（临时存档）：Git stash / 快照分支 / 补丁文件，随时存随时回滚，不改版本号。<br/>"
            "轨道 B（正式发布）：仅在功能稳定后做正式 commit，并更新版本号与描述。",
            body_style,
        )
    )

    story.append(Paragraph("2. 方式总览（按实用度排序）", h1_style))
    table_data = [
        ["方式", "是否进入 Git 历史", "回滚速度", "适用场景"],
        ["Git stash", "否", "很快", "临时保存当前工作区，最像快速存档"],
        ["WIP 分支提交", "是（但在临时分支）", "很快", "需要多次回看，且怕丢数据"],
        ["VS Code 本地历史", "否", "中等", "文件级回退，不适合复杂跨文件回滚"],
        ["git diff 补丁", "否", "中等", "想把改动打包成独立文件备份"],
        ["目录 ZIP 备份", "否", "中等", "大版本前做“整包快照”"],
        ["系统快照/云盘版本", "否", "慢", "灾难恢复（硬盘损坏、误删）"],
    ]
    table = Table(table_data, colWidths=[34 * mm, 34 * mm, 25 * mm, 65 * mm])
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E9EEF7")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("3. 最像“快速存档”的方案：Git stash", h1_style))
    bullets = [
        "特点：不进入正式提交历史，不需要改版本号。",
        "可给每个存档写备注，像游戏存档名一样。",
        "支持只存部分改动（精细化存档）。",
    ]
    story.append(
        ListFlowable(
            [ListItem(Paragraph(i, body_style), leftIndent=12) for i in bullets],
            bulletType="bullet",
        )
    )
    story.append(Paragraph("常用命令：", h2_style))
    story.append(
        Paragraph(
            "保存（包含新文件）：<br/>git stash push -u -m \"wip: 技能UI半成品 2026-02-22 10:30\"<br/>"
            "查看列表：<br/>git stash list<br/>"
            "恢复但不删除存档：<br/>git stash apply stash@{0}<br/>"
            "恢复并删除：<br/>git stash pop stash@{0}<br/>"
            "从存档直接开分支（减少冲突）：<br/>git stash branch recover-ui stash@{0}",
            code_style,
        )
    )

    story.append(Paragraph("4. 严谨型推荐：WIP 临时分支", h1_style))
    story.append(
        Paragraph(
            "如果你非常重视“绝不丢进度”，建议把临时提交放到 `wip/*` 分支。"
            "这样即使本机损坏，也可推送到远端保命；正式主线依然干净。",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "示例流程：<br/>"
            "git switch -c wip/codex-session-20260222<br/>"
            "git add -A<br/>"
            "git commit -m \"wip: 回合技能联调中\"<br/>"
            "（可选）git push -u origin wip/codex-session-20260222<br/>"
            "完成后再挑选有效提交 cherry-pick 到正式分支。",
            code_style,
        )
    )

    story.append(PageBreak())

    story.append(Paragraph("5. VS Code 中文版实操设置（建议）", h1_style))
    story.append(Paragraph("5.1 本地历史与自动保存", h2_style))
    story.append(
        Paragraph(
            "在 `.vscode/settings.json` 建议设置：",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "{<br/>"
            "  \"workbench.localHistory.enabled\": true,<br/>"
            "  \"workbench.localHistory.maxFileEntries\": 500,<br/>"
            "  \"workbench.localHistory.mergeWindow\": 5,<br/>"
            "  \"files.autoSave\": \"afterDelay\",<br/>"
            "  \"files.autoSaveDelay\": 800,<br/>"
            "  \"files.hotExit\": \"onExitAndWindowClose\"<br/>"
            "}",
            code_style,
        )
    )
    story.append(
        Paragraph(
            "中文界面常用入口：<br/>"
            "设置 -> 搜索“本地历史（Local History）”；"
            "资源管理器右键文件 -> 时间线；"
            "命令面板（Ctrl+Shift+P）输入“本地历史”。",
            body_style,
        )
    )
    story.append(Paragraph("5.2 为什么 Ctrl+Z 不一定能撤销 Codex 改动", h2_style))
    story.append(
        Paragraph(
            "因为很多 AI 插件是直接写硬盘，不走编辑器缓冲区，Undo 栈捕获不到。"
            "这不是你操作错，而是工作机制不同。"
            "所以要把“回滚能力”建立在 stash / 分支 / 本地历史上。",
            body_style,
        )
    )

    story.append(Paragraph("6. 非 Git 的补充存档方式", h1_style))
    story.append(
        Paragraph(
            "A. 补丁文件（轻量）<br/>"
            "保存：git diff > .snapshots/2026-02-22-codex.patch<br/>"
            "恢复：git apply .snapshots/2026-02-22-codex.patch",
            code_style,
        )
    )
    story.append(
        Paragraph(
            "B. ZIP 整包（重型）<br/>"
            "适合重大改动前。注意排除 `node_modules` 以减少体积。",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "C. 云盘/系统版本历史<br/>"
            "用于灾难恢复，不适合日常高频回滚。",
            body_style,
        )
    )

    story.append(Paragraph("7. 给你的一套“游戏化存档”工作流", h1_style))
    workflow_items = [
        "快速存档（F5 心法）：每次让 Codex 执行大改前，先 `git stash push -u -m \"pre-codex: 说明 + 时间\"`。",
        "中间存档（自动）：每 30~60 分钟再 stash 一次，命名写清功能点。",
        "读档：出现异常，先 `git stash list`，再 `git stash branch recover-xxx stash@{n}`。",
        "通关存档（正式）：功能稳定后才做正式 commit + 版本号升级 + 发布说明。",
    ]
    story.append(
        ListFlowable(
            [ListItem(Paragraph(i, body_style), leftIndent=12) for i in workflow_items],
            bulletType="bullet",
        )
    )

    story.append(Paragraph("8. 常见风险与规避", h1_style))
    risk_data = [
        ["风险", "表现", "规避办法"],
        ["stash 太多难找", "恢复时找不到正确存档", "命名带“模块+时间+动作”，每周清理一次"],
        ["误把临时改动发布", "主分支历史污染", "固定用 `wip/*` 分支承接临时提交"],
        ["只有本地无远端备份", "电脑故障导致数据丢失", "关键里程碑推送远端分支"],
        ["仅依赖 Ctrl+Z", "AI 直写文件时无法撤销", "把回滚主力切换到 stash/分支/本地历史"],
    ]
    risk_table = Table(risk_data, colWidths=[30 * mm, 55 * mm, 73 * mm])
    risk_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F7EDE8")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(risk_table)

    story.append(Paragraph("9. 一页速查命令卡", h1_style))
    story.append(
        Paragraph(
            "git stash push -u -m \"wip: 说明\"<br/>"
            "git stash list<br/>"
            "git stash apply stash@{0}<br/>"
            "git stash pop stash@{0}<br/>"
            "git stash branch recover-x stash@{0}<br/>"
            "git switch -c wip/feature-x<br/>"
            "git add -A && git commit -m \"wip: xxx\"<br/>"
            "git diff > .snapshots/xxx.patch",
            code_style,
        )
    )
    story.append(
        Paragraph(
            "建议：正式版本号只在“可发布状态”时更新。临时阶段全部走 stash/WIP，既严谨又不扰乱版本节奏。",
            body_style,
        )
    )

    doc.build(story)


def main() -> None:
    output = Path("docs/Codex改动存档与回滚指南_VSCode中文版.pdf")
    output.parent.mkdir(parents=True, exist_ok=True)
    build_pdf(output)
    print(str(output))


if __name__ == "__main__":
    main()
