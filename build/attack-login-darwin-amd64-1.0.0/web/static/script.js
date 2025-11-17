let currentCategory = '';
let refreshInterval = null; // 自动刷新定时器

// 选择分类
function selectCategory(event, type) {
    event.preventDefault();
    currentCategory = type;
    
    // 更新活动状态
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // 更新标题
    const categoryName = type === '' ? '全部' : type;
    document.getElementById('current-category').textContent = categoryName + '连接';
    
    // 刷新连接列表
    refreshConnections();
}

// 刷新连接列表
async function refreshConnections() {
    let url = '/api/connections';
    if (currentCategory) {
        url += '?type=' + encodeURIComponent(currentCategory);
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        displayConnections(data.connections);
        updateCategoryCounts(data.connections);
        
        // 检查是否所有连接任务都已完成
        checkAndStopAutoRefresh(data.connections);
    } catch (error) {
        console.error('刷新连接列表失败:', error);
    }
}

// 检查并停止自动刷新
function checkAndStopAutoRefresh(connections) {
    if (!connections || connections.length === 0) {
        // 没有连接，停止自动刷新
        stopAutoRefresh();
        return;
    }
    
    // 检查是否有 pending 状态的连接
    const hasPending = connections.some(conn => conn.status === 'pending');
    
    if (!hasPending && refreshInterval) {
        // 所有连接都已完成，停止自动刷新
        stopAutoRefresh();
        console.log('所有连接任务已完成，已停止自动刷新');
    }
}

// 停止自动刷新
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// 启动自动刷新
function startAutoRefresh() {
    // 如果已经在运行，先停止
    stopAutoRefresh();
    // 启动新的定时器
    refreshInterval = setInterval(refreshConnections, 3000);
}

// 更新分类计数
function updateCategoryCounts(connections) {
    const counts = {
        'all': connections.length,
        'Redis': 0,
        'FTP': 0,
        'PostgreSQL': 0,
        'MySQL': 0,
        'RabbitMQ': 0,
        'SSH': 0,
        'MongoDB': 0,
        'SMB': 0
    };
    
    connections.forEach(conn => {
        if (counts.hasOwnProperty(conn.type)) {
            counts[conn.type]++;
        }
    });
    
    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-Redis').textContent = counts.Redis;
    document.getElementById('count-FTP').textContent = counts.FTP;
    document.getElementById('count-PostgreSQL').textContent = counts.PostgreSQL;
    document.getElementById('count-MySQL').textContent = counts.MySQL;
    document.getElementById('count-RabbitMQ').textContent = counts.RabbitMQ;
    document.getElementById('count-SSH').textContent = counts.SSH;
    document.getElementById('count-MongoDB').textContent = counts.MongoDB;
    document.getElementById('count-SMB').textContent = counts.SMB;
}

// 显示连接列表
function displayConnections(connections) {
    const listDiv = document.getElementById('connections-list');
    
    if (!connections || connections.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><h3>暂无连接记录</h3><p>请先导入 CSV 文件或手动添加连接</p></div>';
        return;
    }

    let html = '<table class="connections-table">';
    html += '<thead><tr>';
    html += '<th style="width: 30px;"><input type="checkbox" id="select-all" onchange="toggleSelectAll()"></th>';
    html += '<th style="width: 100px;">类型</th>';
    html += '<th style="width: 150px;">IP</th>';
    html += '<th style="width: 80px;">端口</th>';
    html += '<th style="width: 100px;">用户</th>';
    html += '<th style="width: 100px;">状态</th>';
    html += '<th>消息</th>';
    html += '<th style="width: 150px;">创建时间</th>';
    html += '<th style="width: 150px;">操作</th>';
    html += '</tr></thead>';
    html += '<tbody>';
    
    connections.forEach(conn => {
        html += createConnectionRow(conn);
    });
    
    html += '</tbody></table>';
    listDiv.innerHTML = html;
}

// 创建连接表格行
function createConnectionRow(conn) {
    const statusClass = conn.status === 'success' ? 'success' : 
                       conn.status === 'failed' ? 'failed' : 'pending';
    const statusText = conn.status === 'success' ? '成功' : 
                      conn.status === 'failed' ? '失败' : '连接中';
    
    const typeClass = conn.type.toLowerCase();
    const date = new Date(conn.created_at).toLocaleString('zh-CN');
    
    // 检查是否有日志或结果需要展开显示
    const hasDetails = (conn.logs && conn.logs.length > 0) || conn.result;
    const rowId = `row-${conn.id}`;
    const detailsId = `details-${conn.id}`;

    let detailsHtml = '';
    if (hasDetails) {
        let logsHtml = '';
        if (conn.logs && conn.logs.length > 0) {
            logsHtml = '<div class="connection-logs"><strong>连接日志:</strong><ul>';
            conn.logs.forEach(log => {
                logsHtml += `<li>${escapeHtml(log)}</li>`;
            });
            logsHtml += '</ul></div>';
        }

        let resultHtml = '';
        if (conn.result) {
            resultHtml = `<div class="connection-result"><strong>命令执行结果:</strong><br>${escapeHtml(conn.result)}</div>`;
        }

        detailsHtml = `
            <tr id="${detailsId}" class="connection-details-row" style="display: none;">
                <td colspan="9">
                    <div class="connection-details">
                        ${logsHtml}
                        ${resultHtml}
                    </div>
                </td>
            </tr>
        `;
    }

    return `
        <tr id="${rowId}" class="connection-row">
            <td>
                <input type="checkbox" class="conn-checkbox" value="${conn.id}">
            </td>
            <td>
                <span class="connection-type ${typeClass}">${escapeHtml(conn.type)}</span>
            </td>
            <td>${escapeHtml(conn.ip)}</td>
            <td>${escapeHtml(conn.port)}</td>
            <td>${conn.user ? escapeHtml(conn.user) : '-'}</td>
            <td>
                <span class="connection-status ${statusClass}">${statusText}</span>
            </td>
            <td class="message-cell" title="${escapeHtml(conn.message || '无')}">
                ${escapeHtml((conn.message || '无').substring(0, 50))}${(conn.message || '').length > 50 ? '...' : ''}
            </td>
            <td style="font-size: 12px; color: #999;">${date}</td>
            <td>
                <div class="table-actions">
                    ${hasDetails ? `<button class="btn btn-sm btn-secondary" onclick="toggleDetails('${conn.id}')">详情</button>` : ''}
                    <button class="btn btn-sm btn-success" onclick="connectSingle('${conn.id}')">重连</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteConnection('${conn.id}')">删除</button>
                </div>
            </td>
        </tr>
        ${detailsHtml}
    `;
}

// 切换详情显示
function toggleDetails(id) {
    const detailsRow = document.getElementById(`details-${id}`);
    if (detailsRow) {
        if (detailsRow.style.display === 'none') {
            detailsRow.style.display = 'table-row';
        } else {
            detailsRow.style.display = 'none';
        }
    }
}

// 全选/取消全选
function toggleSelectAll() {
    const selectAll = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('.conn-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked;
    });
}

// 转义 HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 显示导入模态框
function showImportModal() {
    document.getElementById('import-modal').classList.add('active');
}

// 显示添加模态框
function showAddModal() {
    document.getElementById('add-modal').classList.add('active');
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// CSV 导入
document.getElementById('import-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const fileInput = document.getElementById('csv-file');
    
    if (!fileInput.files[0]) {
        showResult('import-result', '请选择文件', 'error');
        return;
    }

    formData.append('file', fileInput.files[0]);

    const resultDiv = document.getElementById('import-result');
    resultDiv.className = 'result';
    resultDiv.textContent = '导入中...';

    try {
        const response = await fetch('/api/import', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            showResult('import-result', `成功导入 ${data.count} 条连接记录`, 'success');
            fileInput.value = '';
            closeModal('import-modal');
            startAutoRefresh(); // 启动自动刷新
            setTimeout(refreshConnections, 500);
        } else {
            showResult('import-result', '导入失败: ' + data.error, 'error');
        }
    } catch (error) {
        showResult('import-result', '导入失败: ' + error.message, 'error');
    }
});

// 手动添加连接
document.getElementById('manual-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        type: document.getElementById('conn-type').value,
        ip: document.getElementById('conn-ip').value,
        port: document.getElementById('conn-port').value,
        user: document.getElementById('conn-user').value,
        pass: document.getElementById('conn-pass').value
    };

    const resultDiv = document.getElementById('manual-result');
    resultDiv.className = 'result';
    resultDiv.textContent = '连接中...';

    try {
        const response = await fetch('/api/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            showResult('manual-result', '连接任务已启动', 'success');
            document.getElementById('manual-form').reset();
            closeModal('add-modal');
            startAutoRefresh(); // 启动自动刷新
            setTimeout(refreshConnections, 500);
        } else {
            showResult('manual-result', '连接失败: ' + data.error, 'error');
        }
    } catch (error) {
        showResult('manual-result', '连接失败: ' + error.message, 'error');
    }
});

// 显示结果
function showResult(elementId, message, type) {
    const resultDiv = document.getElementById(elementId);
    resultDiv.textContent = message;
    resultDiv.className = `result ${type}`;
}

// 单个连接
async function connectSingle(id) {
    try {
        const response = await fetch('/api/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: id
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('连接任务已启动');
            startAutoRefresh(); // 启动自动刷新
            setTimeout(refreshConnections, 2000);
        } else {
            alert('连接失败: ' + (data.error || '未知错误'));
        }
    } catch (error) {
        alert('连接失败: ' + error.message);
    }
}

// 批量连接
async function connectAll() {
    const checkboxes = document.querySelectorAll('.conn-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => cb.value);

    if (ids.length === 0) {
        alert('请先选择要连接的记录');
        return;
    }

    try {
        const response = await fetch('/api/connect-batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: ids })
        });

        const data = await response.json();
        if (response.ok) {
            alert(`已启动 ${data.count} 个连接任务`);
            startAutoRefresh(); // 启动自动刷新
            setTimeout(refreshConnections, 2000);
        } else {
            alert('批量连接失败: ' + data.error);
        }
    } catch (error) {
        alert('批量连接失败: ' + error.message);
    }
}

// 删除连接
async function deleteConnection(id) {
    if (!confirm('确定要删除这条连接记录吗？')) {
        return;
    }

    try {
        const response = await fetch(`/api/connections/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            refreshConnections();
        } else {
            alert('删除失败');
        }
    } catch (error) {
        alert('删除失败: ' + error.message);
    }
}

// 点击模态框外部关闭
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// 页面加载时刷新连接列表
document.addEventListener('DOMContentLoaded', () => {
    refreshConnections();
    // 启动自动刷新（如果所有任务都已完成，会自动停止）
    startAutoRefresh();
});
