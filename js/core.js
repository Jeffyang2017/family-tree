// 核心JS文件，处理初始化和事件监听
let jsPDF;
try {
    // 尝试从window.jspdf获取jsPDF
    if (window.jspdf) {
        jsPDF = window.jspdf.jsPDF;
    } else {
        console.error('jsPDF库未正确加载，PDF导出功能可能不可用');
    }
} catch (e) {
    console.error('初始化jsPDF失败:', e);
}

// 检查必要的库是否已加载
function checkDependencies() {
    const missingDependencies = [];
    
    // 检查 xlsx 库
    if (typeof XLSX === 'undefined') {
        missingDependencies.push('XLSX');
    }
    
    // 检查 html2canvas 库
    if (typeof html2canvas === 'undefined') {
        missingDependencies.push('html2canvas');
    }
    
    // 检查 Lunar 库
    if (typeof Lunar === 'undefined') {
        missingDependencies.push('Lunar');
    }
    
    // 如果有缺失的依赖，显示警告
    if (missingDependencies.length > 0) {
        console.warn(`缺少以下依赖库: ${missingDependencies.join(', ')}，部分功能可能无法正常工作`);
        return false;
    }
    
    return true;
}

// 全局变量，存储族谱数据
window.familyTreeData = null;

// 初始化函数
function initApp() {
    // 检查依赖
    const dependenciesLoaded = checkDependencies();
    if (!dependenciesLoaded) {
        const container = document.getElementById('tree-container');
        if (container) {
            container.innerHTML = '<div class="error-message" style="color: red; padding: 20px; text-align: center;">警告：部分必要的库未能加载，功能可能会受限。请检查您的网络连接或刷新页面重试。</div>';
        }
    }

    // 获取DOM元素
    const treeStyleSelect = document.getElementById('treeStyle');
    const calendarStyleSelect = document.getElementById('calendarStyle');
    const excelFileInput = document.getElementById('excelFile');
    const exportPngButton = document.getElementById('exportPng');
    const exportPdfButton = document.getElementById('exportPdf');

    // 监听样式变化
    treeStyleSelect.addEventListener('change', handleStyleChange);
    
    // 监听日历样式变化
    calendarStyleSelect.addEventListener('change', handleCalendarChange);
    
    // 监听文件上传
    excelFileInput.addEventListener('change', handleFileUpload);
    
    // 导出功能
    exportPngButton.addEventListener('click', exportAsPng);
    exportPdfButton.addEventListener('click', exportAsPdf);
}

// 样式变化处理函数
function handleStyleChange() {
    const selectedStyle = this.value;
    const treeContainer = document.querySelector('.family-tree');
    if (treeContainer) {
        treeContainer.className = `family-tree ${selectedStyle}`;
        // 更新所有人物节点的样式
        const persons = treeContainer.querySelectorAll('.person');
        persons.forEach(person => {
            person.className = `person ${selectedStyle}`;
        });
    }
}

// 日历样式变化处理函数
function handleCalendarChange() {
    // 重新生成族谱以更新日期显示
    const treeContainer = document.getElementById('tree-content');
    if (treeContainer && treeContainer.innerHTML.trim()) {
        const rootSelect = document.getElementById('root-select');
        if (rootSelect && rootSelect.value) {
            // 获取当前选中的根节点
            const selectedRootId = rootSelect.value;
            // 重新生成族谱
            const existingData = window.familyTreeData;
            if (existingData) {
                generateFamilyTree(existingData, selectedRootId);
            }
        }
    }
}

// 文件上传处理函数
function handleFileUpload(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            raw: false,
            dateNF: 'yyyy/mm/dd',
            cellDates: true
        });

        // 保存数据以便日历样式更改时使用
        window.familyTreeData = jsonData;
        generateFamilyTree(jsonData);
    };
    reader.readAsArrayBuffer(file);
}

// 创建用于导出的克隆树
function createExportClone() {
    const treeContent = document.getElementById('tree-content');
    if (!treeContent) return null;
    
    // 克隆树内容
    const clone = treeContent.cloneNode(true);
    
    // 创建临时容器
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.opacity = '0';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.style.background = '#fff';
    
    // 添加到文档中进行测量
    document.body.appendChild(tempContainer);
    
    // 去除不必要的外边距和内边距
    clone.style.margin = '0';
    clone.style.padding = '20px';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.display = 'inline-block';
    clone.style.background = '#fff';
    
    // 为克隆树添加特殊样式
    const style = document.createElement('style');
    style.innerHTML = `
        .family-tree {
            max-width: none !important;
            padding: 10px !important;
        }
        
        .person-node, .person {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
        }
        
        .selector-container, .buttons, .controls {
            display: none !important;
        }
    `;
    clone.appendChild(style);
    
    // 添加克隆到临时容器
    tempContainer.appendChild(clone);
    
    // 获取内容的实际尺寸
    const bcr = clone.getBoundingClientRect();
    const width = bcr.width;
    const height = bcr.height;
    
    return {
        clone: clone,
        container: tempContainer,
        width: width,
        height: height
    };
}

// 清理导出后的临时元素
function cleanupExport(exportElements) {
    if (exportElements && exportElements.container) {
        document.body.removeChild(exportElements.container);
    }
}

// 导出为PNG
function exportAsPng() {
    // 显示加载状态
    showLoading('正在生成图片，请稍候...');
    
    // 创建导出克隆
    const exportElements = createExportClone();
    if (!exportElements) {
        hideLoading();
        alert('无法导出图片，请先生成族谱');
        return;
    }
    
    // 为html2canvas设置精确尺寸
    const options = {
        backgroundColor: "#ffffff",
        scale: 2, // 提高分辨率
        useCORS: true,
        logging: false,
        allowTaint: true,
        width: exportElements.width,
        height: exportElements.height
    };
    
    setTimeout(() => {
        html2canvas(exportElements.clone, options).then(canvas => {
            // 清理临时元素
            cleanupExport(exportElements);
            hideLoading();
            
            // 创建下载链接
            const link = document.createElement('a');
            link.download = '家族族谱.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(error => {
            console.error('生成图片失败：', error);
            cleanupExport(exportElements);
            hideLoading();
            alert('生成图片失败，请稍后再试');
        });
    }, 100); // 短暂延迟以确保DOM完全渲染
}

// 导出为PDF
function exportAsPdf() {
    // 检查jsPDF是否可用
    if (!jsPDF) {
        alert('PDF导出功能不可用，请确保您的浏览器已加载jsPDF库');
        return;
    }

    // 显示加载状态
    showLoading('正在生成PDF，请稍候...');
    
    // 创建导出克隆
    const exportElements = createExportClone();
    if (!exportElements) {
        hideLoading();
        alert('无法导出PDF，请先生成族谱');
        return;
    }
    
    // 为html2canvas设置精确尺寸
    const options = {
        backgroundColor: "#ffffff",
        scale: 2, // 提高分辨率
        useCORS: true,
        logging: false,
        allowTaint: true,
        width: exportElements.width,
        height: exportElements.height
    };
    
    setTimeout(() => {
        html2canvas(exportElements.clone, options).then(canvas => {
            // 清理临时元素
            cleanupExport(exportElements);
            hideLoading();
            
            // 确定PDF方向和大小
            const imgWidth = exportElements.width;
            const imgHeight = exportElements.height;
            
            let pdfWidth, pdfHeight, orientation;
            
            // 根据内容比例确定PDF方向和尺寸
            if (imgWidth > imgHeight) {
                orientation = 'landscape';
                // 最大宽度为A4横向宽度（297mm）
                const maxWidth = 297;
                // 根据图像比例计算高度
                pdfWidth = maxWidth;
                pdfHeight = (imgHeight * maxWidth) / imgWidth;
                
                // 确保不超过A4高度（210mm）
                if (pdfHeight > 210) {
                    const scale = 210 / pdfHeight;
                    pdfWidth *= scale;
                    pdfHeight = 210;
                }
            } else {
                orientation = 'portrait';
                // 最大高度为A4纵向高度（297mm）
                const maxHeight = 297;
                // 根据图像比例计算宽度
                pdfHeight = maxHeight;
                pdfWidth = (imgWidth * maxHeight) / imgHeight;
                
                // 确保不超过A4宽度（210mm）
                if (pdfWidth > 210) {
                    const scale = 210 / pdfWidth;
                    pdfHeight *= scale;
                    pdfWidth = 210;
                }
            }
            
            // 创建适当尺寸的PDF
            let pdf;
            try {
                pdf = new jsPDF({
                    orientation: orientation,
                    unit: 'mm',
                    format: [pdfWidth + 20, pdfHeight + 20] // 添加边距
                });
            } catch (e) {
                console.error('创建PDF实例失败:', e);
                hideLoading();
                alert('创建PDF失败，请确保jsPDF库正确加载');
                return;
            }
            
            // 图像在PDF中的位置（居中）
            const xPos = 10;
            const yPos = 10;
            
            // 将图像添加到PDF
            pdf.addImage(
                canvas.toDataURL('image/png'), 
                'PNG', 
                xPos, 
                yPos, 
                pdfWidth, 
                pdfHeight
            );
            
            // 保存PDF
            pdf.save('家族族谱.pdf');
            
        }).catch(error => {
            console.error('生成PDF失败：', error);
            cleanupExport(exportElements);
            hideLoading();
            alert('生成PDF失败，请稍后再试');
        });
    }, 100); // 短暂延迟以确保DOM完全渲染
}

// 显示加载状态
function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.style = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    const loadingContent = document.createElement('div');
    loadingContent.style = `
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    `;
    
    loadingContent.innerHTML = `
        <div class="loading-spinner" style="
            border: 6px solid #f3f3f3;
            border-top: 6px solid #4CAF50;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            margin: 10px auto;
            animation: spin 2s linear infinite;
        "></div>
        <p style="margin: 10px 0; font-size: 16px;">${message}</p>
    `;
    
    // 添加旋转动画
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    loadingDiv.appendChild(loadingContent);
    document.body.appendChild(loadingDiv);
}

// 隐藏加载状态
function hideLoading() {
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) {
        document.body.removeChild(loadingDiv);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);