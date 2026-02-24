#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成《VS Code Git 新手速成指南（含 Git Stash）》PDF。
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
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
        spaceAfter=10,
    )
    h1 = ParagraphStyle(
        "H1CN",
        parent=styles["Heading1"],
        fontName="STSong-Light",
        fontSize=16,
        leading=22,
        spaceBefore=10,
        spaceAfter=6,
    )
    h2 = ParagraphStyle(
        "H2CN",
        parent=styles["Heading2"],
        fontName="STSong-Light",
        fontSize=13,
        leading=18,
        spaceBefore=8,
        spaceAfter=4,
    )
    body = ParagraphStyle(
        "BodyCN",
        parent=styles["BodyText"],
        fontName="STSong-Light",
        fontSize=10.5,
        leading=16,
        spaceAfter=3,
    )
    code = ParagraphStyle(
        "CodeCN",
        parent=body,
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
        title="VS Code Git 新手速成指南（含 Git Stash）",
        author="Project Lysh",
    )

    s = []
    s.append(Paragraph("VS Code Git 新手速成指南（含 Git Stash）", title_style))
    s.append(
        Paragraph(
            "目标：让 0 基础用户在 VS Code 中快速掌握 Git 常规工作流，"
            "并学会用 Git Stash 做“临时存档/读档”。",
            body,
        )
    )
    s.append(Spacer(1, 6))

    s.append(Paragraph("1. 先理解 Git 三层结构", h1))
    s.append(
        Paragraph(
            "工作区（你正在改的文件） -> 暂存区（准备提交的文件） -> 提交历史（已保存版本）",
            body,
        )
    )
    s.append(
        Paragraph(
            "一句话：先改文件，再挑文件进暂存区，最后提交到历史。",
            body,
        )
    )

    s.append(Paragraph("2. VS Code 里最常用的 5 个动作", h1))
    steps = [
        "看改动：左侧源代码管理（Source Control）里看文件列表。",
        "暂存：点文件右侧“+”。",
        "取消暂存：点暂存区文件右侧“-”。",
        "提交：填写 Summary（标题）和 Description（描述）后点击提交。",
        "推送：点击“同步更改”或 Push。"
    ]
    s.append(
        ListFlowable(
            [ListItem(Paragraph(x, body), leftIndent=12) for x in steps],
            bulletType="bullet",
        )
    )

    s.append(Paragraph("3. 命令行等价操作（必须会）", h1))
    s.append(
        Paragraph(
            "查看状态：<br/>git status<br/>"
            "暂存全部：<br/>git add -A<br/>"
            "提交：<br/>git commit -m \"summary\" -m \"description\"<br/>"
            "推送：<br/>git push",
            code,
        )
    )

    s.append(Paragraph("4. 新手日常流程（建议照着做）", h1))
    s.append(
        Paragraph(
            "A. 开始开发前：git pull（先同步）<br/>"
            "B. 开发中：频繁看 git status，确认只改了预期文件<br/>"
            "C. 准备提交：只暂存本次相关文件，不要把无关日志混入<br/>"
            "D. 写清楚 summary/description，再 commit + push",
            body,
        )
    )

    s.append(Paragraph("5. Git Stash 是什么", h1))
    s.append(
        Paragraph(
            "Git Stash = 临时寄存柜。你当前改动先放进去，工作区立刻变干净，后面再拿回来。",
            body,
        )
    )
    s.append(
        Paragraph(
            "适用场景：<br/>"
            "1) 改到一半要紧急切分支修 bug。<br/>"
            "2) 还不想 commit，但又想先保存当前进度。",
            body,
        )
    )

    s.append(Paragraph("6. Stash 核心命令（重点）", h1))
    stash_table = Table(
        [
            ["动作", "命令"],
            ["保存（含未跟踪）", "git stash push -u -m \"wip: 说明\""],
            ["查看列表", "git stash list"],
            ["查看详情", "git stash show -p stash@{0}"],
            ["恢复但不删除", "git stash apply stash@{0}"],
            ["恢复并删除", "git stash pop stash@{0}"],
            ["删除某条", "git stash drop stash@{0}"],
            ["清空全部", "git stash clear"],
            ["从存档建分支", "git stash branch recover-x stash@{0}"],
        ],
        colWidths=[42 * mm, 116 * mm],
    )
    stash_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.6),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF2FF")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    s.append(stash_table)

    s.append(PageBreak())

    s.append(Paragraph("7. 最实用的 Stash 工作流", h1))
    flow = [
        "开发中临时存档：git stash push -u -m \"wip: 技能UI\"",
        "切出去处理紧急任务并提交",
        "回到原分支：git stash list",
        "恢复进度：优先 git stash branch recover-ui stash@{0}",
    ]
    s.append(
        ListFlowable(
            [ListItem(Paragraph(x, body), leftIndent=12) for x in flow],
            bulletType="bullet",
        )
    )

    s.append(Paragraph("8. 为什么 stash 后 changes 看起来“没了”", h1))
    s.append(
        Paragraph(
            "这是正常现象：stash 的设计就是把改动从工作区拿走。"
            "你的改动没丢，在 stash 栈里。用 apply/pop 就能拿回来。",
            body,
        )
    )

    s.append(Paragraph("9. 发布前建议流程", h1))
    s.append(
        Paragraph(
            "1) 先把 stash 准备好（按需 apply）<br/>"
            "2) 检查最终 changes（git status）<br/>"
            "3) 写 Summary + Description 并 commit<br/>"
            "4) （可选）打 Tag：git tag -a v0.8.0 -m \"release v0.8.0\"<br/>"
            "5) push 代码 + push tag",
            body,
        )
    )

    s.append(Paragraph("10. 常见错误与处理", h1))
    risk = Table(
        [
            ["问题", "原因", "处理"],
            ["stash 后改动不见", "被放进 stash", "git stash list + apply/pop"],
            ["apply 冲突", "上下文变了", "先建恢复分支再解决冲突"],
            ["提交混入日志文件", "没有筛选暂存", "只暂存本次相关文件"],
            ["想回到某个版本", "没有版本锚点", "使用 tag 标记发布点"],
        ],
        colWidths=[34 * mm, 46 * mm, 78 * mm],
    )
    risk.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.6),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#FFF1E8")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    s.append(risk)

    s.append(Paragraph("11. 一页命令速查", h1))
    s.append(
        Paragraph(
            "git status<br/>"
            "git add -A<br/>"
            "git commit -m \"summary\" -m \"description\"<br/>"
            "git push<br/>"
            "git stash push -u -m \"wip: xxx\"<br/>"
            "git stash list<br/>"
            "git stash apply stash@{0}<br/>"
            "git stash pop stash@{0}<br/>"
            "git stash branch recover-x stash@{0}<br/>"
            "git tag -a v0.8.0 -m \"release v0.8.0\"<br/>"
            "git push origin --tags",
            code,
        )
    )

    doc.build(s)


def main() -> None:
    output = Path("docs/VSCode_Git_新手速成指南_含Stash.pdf")
    output.parent.mkdir(parents=True, exist_ok=True)
    build_pdf(output)
    print(str(output))


if __name__ == "__main__":
    main()
