# 家族族谱生成器

这是一个基于 Web 的家族族谱生成器，允许用户通过上传 Excel 文件来创建和可视化家族关系。

## 功能特点

- 支持从 Excel 文件导入家族数据
- 提供多种族谱样式（垂直、水平、经典、树形图）
- 支持公历和农历日期显示
- 可导出为 PNG 图片或 PDF 文档

## 使用方法

1. 准备一个包含以下列的 Excel 文件：
   - 人物ID
   - 姓名
   - 性别 (男/女)
   - 父亲ID
   - 母亲ID
   - 配偶ID
   - 出生日期
   - 死亡日期

2. 将 Excel 文件上传到应用
3. 选择族谱样式和日期显示格式
4. 使用导出按钮将族谱保存为图片或 PDF

## 技术细节

- 前端框架：纯 HTML/CSS/JavaScript
- 数据处理：Excel 文件解析使用 XLSX 库
- 图像生成：使用 html2canvas
- PDF 生成：使用 jsPDF
- 农历转换：lunar.js 库

## 开发者信息

- 项目维护者：[jeffyang2017](https://github.com/jeffyang2017)]
- 联系方式：jeffyang2017@foxmail.com
- 许可证：MIT