// 日期处理工具函数

// 解析日期字符串 - 支持 Excel 日期格式和标准日期格式
function parseDate(dateStr) {
    if (!dateStr) return null;
    if (/^\d+$/.test(dateStr)) {
        const excelDate = parseInt(dateStr);
        const utcDays = Math.floor(excelDate - 25569);
        const utcValue = utcDays * 86400;
        return new Date(utcValue * 1000);
    }
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
    }
    console.warn(`无法解析日期: ${dateStr}`);
    return null;
}

// 转换为农历日期 - 使用 Lunar 库进行转换
function toLunarDate(date) {
    if (!date || isNaN(date.getTime())) return '';
    try {
        // 检查Lunar库是否可用
        if (typeof Lunar === 'undefined') {
            console.error('Lunar库未加载，无法转换为农历日期');
            return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
        }
        
        // 使用Lunar库转换为农历日期
        const lunar = Lunar.fromDate(date);
        // 使用天干地支年+农历月+农历日
        return `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
    } catch (e) {
        console.error('转换农历日期失败:', e);
        return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
    }
}

// 格式化日期显示 - 根据用户选择的日期格式返回相应格式
function formatDate(date) {
    if (!date || isNaN(date.getTime())) return '';
    
    const calendarStyle = document.getElementById('calendarStyle').value;
    
    // 如果选择了"不显示"，则返回空字符串
    if (calendarStyle === 'none') {
        return '';
    }
    
    // 公历日期格式化
    const solarDate = `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月${date.getDate().toString().padStart(2, '0')}日`;
    
    // 根据选择的日历样式返回不同格式
    if (calendarStyle === 'solar') {
        return solarDate;
    } else if (calendarStyle === 'lunar') {
        return toLunarDate(date);
    } else if (calendarStyle === 'both') {
        const lunarDate = toLunarDate(date);
        return `${solarDate} (${lunarDate})`;
    }
    
    return solarDate;
} 