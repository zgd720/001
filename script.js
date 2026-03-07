// 待办事项应用主逻辑

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const editModal = document.getElementById('editModal');
    const deleteModal = document.getElementById('deleteModal');
    const editForm = document.getElementById('editForm');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const notification = document.getElementById('notification');
    const totalTasksElement = document.getElementById('totalTasks');
    const completedTasksElement = document.getElementById('completedTasks');
    
    // 模态框控制按钮
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    
    // 当前过滤器和要删除的任务ID
    let currentFilter = 'all';
    let taskToDelete = null;
    
    // 初始化应用
    init();
    
    // 初始化函数
    function init() {
        // 加载任务
        loadTasks();
        
        // 设置事件监听器
        setupEventListeners();
        
        // 设置今天的日期作为最小日期
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDeadline').setAttribute('min', today);
        document.getElementById('editTaskDeadline').setAttribute('min', today);
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        // 表单提交
        taskForm.addEventListener('submit', handleAddTask);
        editForm.addEventListener('submit', handleEditTask);
        
        // 模态框控制
        closeModal.addEventListener('click', () => closeModalFunc(editModal));
        cancelEdit.addEventListener('click', () => closeModalFunc(editModal));
        closeDeleteModal.addEventListener('click', () => closeModalFunc(deleteModal));
        cancelDelete.addEventListener('click', () => closeModalFunc(deleteModal));
        confirmDelete.addEventListener('click', handleDeleteTask);
        
        // 点击模态框外部关闭
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeModalFunc(editModal);
        });
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeModalFunc(deleteModal);
        });
        
        // 过滤器按钮
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 更新活动按钮
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 更新当前过滤器并重新渲染任务
                currentFilter = btn.getAttribute('data-filter');
                renderTasks();
            });
        });
    }
    
    // 生成唯一ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // 从localStorage加载任务
    function loadTasks() {
        const savedTasks = localStorage.getItem('todoTasks');
        if (savedTasks) {
            return JSON.parse(savedTasks);
        }
        return [];
    }
    
    // 保存任务到localStorage
    function saveTasks(tasks) {
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
        updateStats();
    }
    
    // 添加任务
    function handleAddTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const deadline = document.getElementById('taskDeadline').value;
        const priority = document.getElementById('taskPriority').value;
        
        if (!title) {
            showNotification('请输入任务标题', 'error');
            return;
        }
        
        const newTask = {
            id: generateId(),
            title,
            description,
            deadline,
            priority,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        const tasks = loadTasks();
        tasks.unshift(newTask);
        saveTasks(tasks);
        
        // 重置表单
        taskForm.reset();
        
        // 重新渲染任务列表
        renderTasks();
        
        // 显示成功通知
        showNotification('任务添加成功！', 'success');
    }
    
    // 渲染任务列表
    function renderTasks() {
        const tasks = loadTasks();
        let filteredTasks = filterTasks(tasks, currentFilter);
        
        // 清空任务列表
        taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // 渲染每个任务
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
        
        // 更新统计信息
        updateStats();
    }
    
    // 过滤任务
    function filterTasks(tasks, filter) {
        switch (filter) {
            case 'pending':
                return tasks.filter(task => task.status === 'pending');
            case 'completed':
                return tasks.filter(task => task.status === 'completed');
            case 'high':
                return tasks.filter(task => task.priority === 'high');
            default:
                return tasks;
        }
    }
    
    // 创建任务元素
    function createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.status === 'completed' ? 'completed' : ''} ${task.priority}-priority`;
        
        // 检查是否过期
        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
        
        taskItem.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <div class="task-actions">
                    <button class="task-btn toggle-status" data-id="${task.id}" title="${task.status === 'completed' ? '标记为待完成' : '标记为已完成'}">
                        <i class="fas ${task.status === 'completed' ? 'fa-check-circle' : 'fa-circle'}"></i>
                    </button>
                    <button class="task-btn edit" data-id="${task.id}" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete" data-id="${task.id}" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
            <div class="task-meta">
                <div class="task-deadline ${isOverdue ? 'overdue' : ''}">
                    ${task.deadline ? `<i class="fas fa-calendar-alt"></i> ${formatDate(task.deadline)}` : ''}
                </div>
                <div class="priority-badge priority-${task.priority}">
                    ${task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}优先级
                </div>
            </div>
        `;
        
        // 添加事件监听器
        const toggleBtn = taskItem.querySelector('.toggle-status');
        const editBtn = taskItem.querySelector('.edit');
        const deleteBtn = taskItem.querySelector('.delete');
        
        toggleBtn.addEventListener('click', () => toggleTaskStatus(task.id));
        editBtn.addEventListener('click', () => openEditModal(task.id));
        deleteBtn.addEventListener('click', () => openDeleteModal(task.id));
        
        return taskItem;
    }
    
    // 切换任务状态
    function toggleTaskStatus(taskId) {
        const tasks = loadTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].status = tasks[taskIndex].status === 'completed' ? 'pending' : 'completed';
            saveTasks(tasks);
            renderTasks();
            
            const statusText = tasks[taskIndex].status === 'completed' ? '已完成' : '待完成';
            showNotification(`任务状态已更新为${statusText}`, 'info');
        }
    }
    
    // 打开编辑模态框
    function openEditModal(taskId) {
        const tasks = loadTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        // 填充表单
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskDeadline').value = task.deadline || '';
        document.getElementById('editTaskPriority').value = task.priority;
        document.getElementById('editTaskStatus').value = task.status;
        
        // 显示模态框
        editModal.classList.add('show');
    }
    
    // 处理编辑任务
    function handleEditTask(e) {
        e.preventDefault();
        
        const taskId = document.getElementById('editTaskId').value;
        const title = document.getElementById('editTaskTitle').value.trim();
        const description = document.getElementById('editTaskDescription').value.trim();
        const deadline = document.getElementById('editTaskDeadline').value;
        const priority = document.getElementById('editTaskPriority').value;
        const status = document.getElementById('editTaskStatus').value;
        
        if (!title) {
            showNotification('请输入任务标题', 'error');
            return;
        }
        
        const tasks = loadTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                description,
                deadline,
                priority,
                status,
                updatedAt: new Date().toISOString()
            };
            
            saveTasks(tasks);
            closeModalFunc(editModal);
            renderTasks();
            showNotification('任务更新成功！', 'success');
        }
    }
    
    // 打开删除确认模态框
    function openDeleteModal(taskId) {
        taskToDelete = taskId;
        deleteModal.classList.add('show');
    }
    
    // 处理删除任务
    function handleDeleteTask() {
        if (!taskToDelete) return;
        
        const tasks = loadTasks();
        const updatedTasks = tasks.filter(task => task.id !== taskToDelete);
        
        saveTasks(updatedTasks);
        closeModalFunc(deleteModal);
        renderTasks();
        showNotification('任务已删除', 'info');
        
        taskToDelete = null;
    }
    
    // 关闭模态框
    function closeModalFunc(modal) {
        modal.classList.remove('show');
    }
    
    // 更新统计信息
    function updateStats() {
        const tasks = loadTasks();
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        
        totalTasksElement.textContent = totalTasks;
        completedTasksElement.textContent = completedTasks;
    }
    
    // 显示通知
    function showNotification(message, type = 'info') {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        // 3秒后自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // 格式化日期
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('zh-CN', options);
    }
    
    // HTML转义，防止XSS攻击
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, m => map[m]);
    }
});