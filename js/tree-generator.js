// 树形图生成器，负责处理族谱数据和渲染

// 族谱生成函数 - 主要入口点
function generateFamilyTree(data, selectedRootId = null) {
    const container = document.getElementById('tree-container');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p>没有找到族谱数据</p>';
        return;
    }

    // 创建人物ID映射，提高查询效率
    const personMap = {};
    data.forEach(person => {
        person.配偶ID = String(person.配偶ID || '');
        personMap[person.人物ID] = person;
    });
    
    // 缓存映射供其他函数使用
    window.personMap = personMap;

    // 创建下拉框容器
    const selectContainer = document.createElement('div');
    selectContainer.className = 'select-container';
    
    // 创建可搜索的下拉列表组件
    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'select-wrapper';
    
    // 将所有人添加到数组中，按姓名排序
    const sortedData = [...data].sort((a, b) => {
        const nameA = a.姓名 || '未知';
        const nameB = b.姓名 || '未知';
        return nameA.localeCompare(nameB, 'zh-CN');
    });
    
    // 创建下拉菜单选择器
    const rootSelect = document.createElement('select');
    rootSelect.id = 'root-select';
    rootSelect.className = 'root-selector';
    rootSelect.size = 10; // 显示10个选项
    
    // 添加提示标签
    const selectLabel = document.createElement('label');
    selectLabel.htmlFor = 'root-select';
    selectLabel.textContent = '选择任意一人作为族谱起点：';
    selectLabel.style.display = 'block';
    selectLabel.style.marginBottom = '5px';
    selectLabel.style.fontWeight = 'bold';
    selectLabel.style.color = '#333';
    
    // 将标签添加到容器中
    selectContainer.appendChild(selectLabel);
    
    // 添加所有人物选项
    sortedData.forEach(person => {
        const option = document.createElement('option');
        option.value = person.人物ID;
        option.textContent = person.姓名 || '未知';
        rootSelect.appendChild(option);
    });
    
    // 创建搜索输入框
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'person-search';
    searchInput.className = 'person-search';
    searchInput.placeholder = '搜索姓名...';
    
    // 清除按钮
    const clearButton = document.createElement('button');
    clearButton.className = 'search-clear-button';
    clearButton.innerHTML = '×';
    clearButton.title = '清除搜索';
    clearButton.style.display = 'none';
    
    // 将元素添加到容器中
    selectWrapper.appendChild(searchInput);
    selectWrapper.appendChild(clearButton);
    
    selectContainer.appendChild(selectWrapper);
    selectContainer.appendChild(rootSelect);
    
    // 搜索功能实现
    searchInput.addEventListener('input', function() {
        const searchText = this.value.trim().toLowerCase();
        
        // 显示/隐藏清除按钮
        clearButton.style.display = searchText ? 'block' : 'none';
        
        // 如果搜索框为空，显示所有选项
        if (!searchText) {
            const options = Array.from(rootSelect.querySelectorAll('option'));
            options.forEach(option => {
                option.style.display = '';
            });
            return;
        }
        
        // 过滤下拉列表选项
        const options = Array.from(rootSelect.querySelectorAll('option'));
        options.forEach(option => {
            const name = option.textContent.toLowerCase();
            option.style.display = name.includes(searchText) ? '' : 'none';
        });
    });
    
    // 输入框选择事件
    searchInput.addEventListener('change', function() {
        const searchText = this.value.trim();
        
        // 查找匹配的人物
        const matchedPerson = sortedData.find(person => 
            (person.姓名 || '未知') === searchText
        );
        
        // 如果找到匹配的人物，更新下拉列表并生成族谱
        if (matchedPerson) {
            rootSelect.value = matchedPerson.人物ID;
            generateFamilyTree(data, matchedPerson.人物ID);
        }
    });
    
    // 清除按钮事件
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        this.style.display = 'none';
        searchInput.focus();
        
        // 恢复所有选项可见
        const options = Array.from(rootSelect.querySelectorAll('option')).slice(1);
        options.forEach(option => {
            option.style.display = '';
        });
    });
    
    // 按键事件处理
    searchInput.addEventListener('keydown', function(e) {
        // ESC键清空搜索
        if (e.key === 'Escape') {
            this.value = '';
            clearButton.style.display = 'none';
            
            // 恢复所有选项可见
            const options = Array.from(rootSelect.querySelectorAll('option')).slice(1);
            options.forEach(option => {
                option.style.display = '';
            });
        }
        
        // Enter键选择第一个可见选项
        if (e.key === 'Enter') {
            e.preventDefault();
            
            const visibleOptions = Array.from(rootSelect.querySelectorAll('option'))
                .filter(option => option.style.display !== 'none' && option.value);
            
            if (visibleOptions.length > 0) {
                rootSelect.value = visibleOptions[0].value;
                generateFamilyTree(data, visibleOptions[0].value);
            }
        }
    });
    
    // 下拉列表变化事件
    rootSelect.addEventListener('change', function() {
        const selectedId = this.value;
        if (selectedId) {
            // 更新搜索框的值为选中的人物名称
            const selectedOption = this.options[this.selectedIndex];
            searchInput.value = selectedOption.textContent;
            
            // 生成族谱
            generateFamilyTree(data, selectedId);
            
            // 选择后自动失去焦点，隐藏下拉框
            this.blur();
        } else {
            container.innerHTML = '';
        }
    });
    
    // 如果有预选的ID，设置为选中状态
    if (selectedRootId) {
        rootSelect.value = selectedRootId;
        // 同时更新搜索框
        const selectedOption = rootSelect.querySelector(`option[value="${selectedRootId}"]`);
        if (selectedOption) {
            searchInput.value = selectedOption.textContent;
        }
    }
    
    // 下拉框和搜索框失去焦点时隐藏下拉框
    document.addEventListener('click', function(e) {
        // 如果点击的不是搜索框、下拉框或它们的子元素
        if (!e.target.closest('.select-wrapper') && 
            !e.target.closest('.root-selector')) {
            // 让下拉框失去焦点
            if (rootSelect) {
                rootSelect.blur();
            }
        }
    });
    
    const treeWrapper = document.createElement('div');
    treeWrapper.className = 'tree-wrapper';
    
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'selector-container';
    selectorContainer.appendChild(selectContainer);
    container.appendChild(selectorContainer);
    
    const treeContainer = document.createElement('div');
    treeContainer.id = 'tree-content';
    treeWrapper.appendChild(treeContainer);
    container.appendChild(treeWrapper);
    
    // 如果选择了一个根节点
    if (selectedRootId) {
        // 找到选中的人物作为根节点
        const selectedRoot = personMap[selectedRootId];
        if (!selectedRoot) {
            treeContainer.innerHTML = '<p>未找到选中的人物，请重新选择</p>';
            return;
        }
        
        const renderTarget = treeContainer;
        const selectedStyle = document.getElementById('treeStyle').value;

        // 创建族谱树
        const treeDiv = document.createElement('div');
        treeDiv.className = `family-tree ${selectedStyle}`;
        
        // 计算族谱规模，预估宽度
        const { depth, width } = calculateTreeSize(selectedRoot, 0);
        
        // 设置适当的宽度以避免内容挤压
        if (width > 5) {
            // 如果树很宽，增加容器宽度
            treeContainer.style.minWidth = Math.max(1000, width * 150) + 'px';
        }
        
        // 构建树
        const rootNode = buildTree(selectedRoot, 0, null);
        treeDiv.innerHTML = rootNode;
        
        renderTarget.appendChild(treeDiv);
        
        // 调整树形图样式，确保更好的显示效果
        adjustTreeDisplay();
    }
}

// 计算树的规模 - 用于确定容器大小
function calculateTreeSize(person, level) {
    if (!person) return { depth: level, width: 0 };
    
    let maxChildDepth = level;
    let totalWidth = 1; // 当前节点宽度
    
    // 查找所有子代
    const children = window.familyTreeData.filter(child =>
        child.父亲ID === person.人物ID || child.母亲ID === person.人物ID
    );
    
    if (children.length === 0) {
        return { depth: level, width: 1 };
    }
    
    // 递归计算每个子代的规模
    children.forEach(child => {
        const { depth, width } = calculateTreeSize(child, level + 1);
        maxChildDepth = Math.max(maxChildDepth, depth);
        totalWidth += width;
    });
    
    return { depth: maxChildDepth, width: totalWidth };
}

// 调整树的显示 - 根据不同样式优化显示效果
function adjustTreeDisplay() {
    const selectedStyle = document.getElementById('treeStyle').value;
    const treeContent = document.getElementById('tree-content');
    
    // 根据不同样式应用不同的优化
    if (selectedStyle === 'tree') {
        // 对于树形样式，确保连接线正确显示
        const childContainers = treeContent.querySelectorAll('.children-container');
        childContainers.forEach(container => {
            const children = container.querySelectorAll('.child');
            if (children.length > 4) {
                container.style.maxWidth = (children.length * 220) + 'px';
            }
        });
    } else if (selectedStyle === 'horizontal') {
        // 对于水平样式，增加间距以显示所有内容
        const persons = treeContent.querySelectorAll('.person.horizontal');
        persons.forEach(person => {
            person.style.marginRight = '20px';
        });
    }
}

// 获取性别图标 - 返回对应性别的 SVG 图标
function getGenderIcon(gender) {
    if (gender === '男') {
        return `<span class="gender-icon gender-male" title="男性">
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M20,11V7H16V3H12V7H8V11H12V8L16,12L12,16V13H8V17H12V21H16V17H20V13H16V16L12,12L16,8V11H20Z" />
            </svg>
        </span>`;
    } else if (gender === '女') {
        return `<span class="gender-icon gender-female" title="女性">
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12,4A6,6 0 0,1 18,10C18,12.97 15.84,15.44 13,15.92V18H15V20H13V22H11V20H9V18H11V15.92C8.16,15.44 6,12.97 6,10A6,6 0 0,1 12,4M12,6A4,4 0 0,0 8,10A4,4 0 0,0 12,14A4,4 0 0,0 16,10A4,4 0 0,0 12,6Z" />
            </svg>
        </span>`;
    }
    return `<span class="gender-icon gender-unknown" title="未知">
        <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7" />
        </svg>
    </span>`;
}

// 获取子女序号标记 - 显示在人物名称旁边
function getChildOrderLabel(index) {
    return `<span class="child-order" title="第${index + 1}子女">${index + 1}</span>`;
}

// 构建树节点 - 递归函数，构建整个族谱树的 HTML
function buildTree(person, level = 0, parentInfo = null) {
    if (!person) return '';
    
    const birthDate = formatDate(parseDate(person.出生日期));
    const deathDate = formatDate(parseDate(person.死亡日期));
    const selectedStyle = document.getElementById('treeStyle').value;
    
    // 获取性别图标
    const genderIcon = getGenderIcon(person.性别);

    // 使用personMap提高性能
    const personMap = window.personMap || {};
    
    // 确定子女序号
    let childOrderLabel = '';
    if (parentInfo && parentInfo.childIndex !== undefined) {
        childOrderLabel = getChildOrderLabel(parentInfo.childIndex);
    }

    // 代数显示标签
    const generationLabel = `第${level + 1}代`;

    let html = '';
    if (selectedStyle === 'tree') {
        html = `<div class="person ${selectedStyle}">`;
        html += `<div class="person-node">`;
        html += `<div class="person-content">`;
        html += `<div class="generation">${generationLabel}</div>`;
        html += `<div class="name">${childOrderLabel}${person.姓名 || '未知'} ${genderIcon}</div>`;
        html += `<div class="dates">${birthDate || ''} ${deathDate ? ' - ' + deathDate : ''}</div>`;
        html += `</div>`;

        if (person.配偶ID) {
            const spouseIdStr = String(person.配偶ID || '');
            const spouseIds = spouseIdStr.split(',');
            spouseIds.forEach(spouseId => {
                const spouse = personMap[spouseId] || window.familyTreeData.find(p => p.人物ID === spouseId);
                if (spouse) {
                    const spouseBirthDate = formatDate(parseDate(spouse.出生日期));
                    const spouseDeathDate = formatDate(parseDate(spouse.死亡日期));
                    const spouseGenderIcon = getGenderIcon(spouse.性别);
                    html += `<div class="spouse-details">`;
                    html += `<div class="spouse-content">`;
                    html += `<div class="name">${spouse.姓名 || '未知'} ${spouseGenderIcon}</div>`;
                    html += `<div class="dates">${spouseBirthDate || ''} ${spouseDeathDate ? ' - ' + spouseDeathDate : ''}</div>`;
                    html += `</div>`;
                    html += `</div>`;
                }
            });
        }
        html += `</div>`;

        // 获取并排序子代
        const children = window.familyTreeData.filter(child =>
            child.父亲ID === person.人物ID || child.母亲ID === person.人物ID
        );

        // 按出生日期排序子女
        children.sort((a, b) => {
            const dateA = parseDate(a.出生日期);
            const dateB = parseDate(b.出生日期);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA - dateB;
        });

        if (children.length > 0) {
            html += '<div class="children">';
            html += '<div class="children-container">';
            children.forEach((child, index) => {
                const childInfo = {
                    childIndex: index,
                    totalChildren: children.length
                };
                html += `<div class="child">${buildTree(child, level + 1, childInfo)}</div>`;
            });
            html += '</div>';
            html += '</div>';
        }

        html += '</div>';
    } else if (selectedStyle === 'classic') {
        html = `<div class="person ${selectedStyle}">`;
        html += `<div class="person-node">`;
        html += `<div class="person-content">`;
        html += `<div class="generation">${generationLabel}</div>`;
        html += `<div class="name">${childOrderLabel}${person.姓名 || '未知'} ${genderIcon}</div>`;
        html += `<div class="dates">${birthDate || ''} ${deathDate ? ' - ' + deathDate : ''}</div>`;
        html += `</div>`;

        if (person.配偶ID) {
            const spouseIdStr = String(person.配偶ID || '');
            const spouseIds = spouseIdStr.split(',');
            spouseIds.forEach(spouseId => {
                const spouse = personMap[spouseId] || window.familyTreeData.find(p => p.人物ID === spouseId);
                if (spouse) {
                    const spouseBirthDate = formatDate(parseDate(spouse.出生日期));
                    const spouseDeathDate = formatDate(parseDate(spouse.死亡日期));
                    const spouseGenderIcon = getGenderIcon(spouse.性别);
                    html += `<div class="spouse-details">`;
                    html += `<span class="name">${spouse.姓名 || '未知'} ${spouseGenderIcon}</span>`;
                    html += `<span class="connector"></span>`;
                    html += `<span class="dates">${spouseBirthDate || ''} ${spouseDeathDate ? ' - ' + spouseDeathDate : ''}</span>`;
                    html += `</div>`;
                }
            });
        }
        html += `</div>`;

        const children = window.familyTreeData.filter(child =>
            child.父亲ID === person.人物ID || child.母亲ID === person.人物ID
        );

        // 按出生日期排序子女
        children.sort((a, b) => {
            const dateA = parseDate(a.出生日期);
            const dateB = parseDate(b.出生日期);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA - dateB;
        });

        if (children.length > 0) {
            html += '<div class="children">';
            html += '<div class="connector"></div>';
            html += '<div class="children-container">';
            children.forEach((child, index) => {
                const childInfo = {
                    childIndex: index,
                    totalChildren: children.length
                };
                html += buildTree(child, level + 1, childInfo);
            });
            html += '</div>';
            html += '</div>';
        }

        html += '</div>';
    } else if (selectedStyle === 'vertical') {
        html = `<div class="person ${selectedStyle}">`;
        html += `<div class="person-info">`;
        html += `<div class="person-details">`;
        html += `<div class="generation">${generationLabel}</div>`;
        html += `<div class="name">${childOrderLabel}${person.姓名 || '未知'} ${genderIcon}</div>`;
        html += `<div class="dates">${birthDate || ''} ${deathDate ? ' - ' + deathDate : ''}</div>`;
        html += `</div>`;

        if (person.配偶ID) {
            const spouseIdStr = String(person.配偶ID || '');
            const spouseIds = spouseIdStr.split(',');
            spouseIds.forEach(spouseId => {
                const spouse = personMap[spouseId] || window.familyTreeData.find(p => p.人物ID === spouseId);
                if (spouse) {
                    const spouseBirthDate = formatDate(parseDate(spouse.出生日期));
                    const spouseDeathDate = formatDate(parseDate(spouse.死亡日期));
                    const spouseGenderIcon = getGenderIcon(spouse.性别);
                    html += `<div class="spouse-details">`;
                    html += `<span class="name">${spouse.姓名 || '未知'} ${spouseGenderIcon}</span>`;
                    html += `<span class="connector">❤</span>`;
                    html += `<span class="dates">${spouseBirthDate || ''} ${spouseDeathDate ? ' - ' + spouseDeathDate : ''}</span>`;
                    html += `</div>`;
                }
            });
        }
        html += `</div>`;

        const children = window.familyTreeData.filter(child =>
            child.父亲ID === person.人物ID || child.母亲ID === person.人物ID
        );

        // 按出生日期排序子女
        children.sort((a, b) => {
            const dateA = parseDate(a.出生日期);
            const dateB = parseDate(b.出生日期);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA - dateB;
        });

        if (children.length > 0) {
            html += '<div class="children">';
            children.forEach((child, index) => {
                const childInfo = {
                    childIndex: index,
                    totalChildren: children.length
                };
                html += buildTree(child, level + 1, childInfo);
            });
            html += '</div>';
        }

        html += '</div>';
    } else if (selectedStyle === 'horizontal') {
        html = `<div class="person ${selectedStyle}">`;
        html += `<div class="person-info">`;
        html += `<div class="person-details">`;
        html += `<div class="generation">${generationLabel}</div>`;
        html += `<div class="name">${childOrderLabel}${person.姓名 || '未知'} ${genderIcon}</div>`;
        html += `<div class="dates">${birthDate || ''} ${deathDate ? ' - ' + deathDate : ''}</div>`;
        html += `</div>`;

        if (person.配偶ID) {
            const spouseIdStr = String(person.配偶ID || '');
            const spouseIds = spouseIdStr.split(',');
            spouseIds.forEach(spouseId => {
                const spouse = personMap[spouseId] || window.familyTreeData.find(p => p.人物ID === spouseId);
                if (spouse) {
                    const spouseBirthDate = formatDate(parseDate(spouse.出生日期));
                    const spouseDeathDate = formatDate(parseDate(spouse.死亡日期));
                    const spouseGenderIcon = getGenderIcon(spouse.性别);
                    html += `<div class="spouse-details">`;
                    html += `<span class="name">${spouse.姓名 || '未知'} ${spouseGenderIcon}</span>`;
                    html += `<span class="connector">❤</span>`;
                    html += `<span class="dates">${spouseBirthDate || ''} ${spouseDeathDate ? ' - ' + spouseDeathDate : ''}</span>`;
                    html += `</div>`;
                }
            });
        }
        html += `</div>`;

        const children = window.familyTreeData.filter(child =>
            child.父亲ID === person.人物ID || child.母亲ID === person.人物ID
        );

        // 按出生日期排序子女
        children.sort((a, b) => {
            const dateA = parseDate(a.出生日期);
            const dateB = parseDate(b.出生日期);
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA - dateB;
        });

        if (children.length > 0) {
            html += '<div class="children">';
            children.forEach((child, index) => {
                const childInfo = {
                    childIndex: index,
                    totalChildren: children.length
                };
                html += buildTree(child, level + 1, childInfo);
            });
            html += '</div>';
        }

        html += '</div>';
    }

    return html;
} 