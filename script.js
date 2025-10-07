// Expense Tracker JavaScript
class ExpenseTracker {
    constructor() {
        this.expenses = this.loadExpenses();
        this.charts = {};
        this.currentChart = 'category';
        this.init();
    }

    init() {
        this.bindEvents();
        this.setDefaultDate();
        this.updateDisplay();
        this.initCharts();
    }

    bindEvents() {
        // Form submission
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Filter by category
        document.getElementById('filterCategory').addEventListener('change', (e) => {
            this.filterExpenses(e.target.value);
        });

        // Clear all expenses
        document.getElementById('clearAll').addEventListener('click', () => {
            this.clearAllExpenses();
        });

        // Export data
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportToCSV();
        });

        // Chart tab switching
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchChart(e.target.dataset.chart);
            });
        });

        // Add a manual refresh button for debugging
        setTimeout(() => {
            console.log('Checking charts after delay...');
            if (Object.keys(this.charts).length === 0) {
                console.log('Charts not initialized, retrying...');
                this.initCharts();
            }
        }, 1000);
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    addExpense() {
        const formData = new FormData(document.getElementById('expenseForm'));

        const expense = {
            id: Date.now().toString(),
            description: formData.get('description').trim(),
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            date: formData.get('date'),
            timestamp: new Date().toISOString()
        };

        // Validation
        if (!expense.description || !expense.amount || !expense.category || !expense.date) {
            alert('Please fill in all fields');
            return;
        }

        if (expense.amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }

        this.expenses.unshift(expense); // Add to beginning of array
        this.saveExpenses();
        this.updateDisplay();
        this.resetForm();

        // Show success feedback
        this.showNotification('Expense added successfully!', 'success');
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveExpenses();
            this.updateDisplay();
            this.showNotification('Expense deleted!', 'info');
        }
    }

    editExpense(id) {
        const expense = this.expenses.find(exp => exp.id === id);
        if (expense) {
            // Fill form with expense data
            document.getElementById('description').value = expense.description;
            document.getElementById('amount').value = expense.amount;
            document.getElementById('category').value = expense.category;
            document.getElementById('date').value = expense.date;

            // Remove the expense and let user re-add it
            this.deleteExpense(id);

            // Scroll to form
            document.querySelector('.add-expense-section').scrollIntoView({
                behavior: 'smooth'
            });
        }
    }

    filterExpenses(category = '') {
        const filteredExpenses = category
            ? this.expenses.filter(expense => expense.category === category)
            : this.expenses;

        this.renderExpenses(filteredExpenses);
    }

    clearAllExpenses() {
        if (confirm('Are you sure you want to delete all expenses? This action cannot be undone.')) {
            this.expenses = [];
            this.saveExpenses();
            this.updateDisplay();
            this.showNotification('All expenses cleared!', 'info');
        }
    }

    updateDisplay() {
        this.updateStats();
        this.renderExpenses(this.expenses);
        this.updateCharts();
    }

    updateStats() {
        const total = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyTotal = this.expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === currentMonth &&
                    expenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, expense) => sum + expense.amount, 0);

        document.getElementById('totalSpent').textContent = this.formatCurrency(total);
        document.getElementById('monthlySpent').textContent = this.formatCurrency(monthlyTotal);
        document.getElementById('expenseCount').textContent = this.expenses.length;
    }

    renderExpenses(expenses) {
        const container = document.getElementById('expensesList');

        if (expenses.length === 0) {
            container.innerHTML = `
                <div class="no-expenses">
                    <p>No expenses found. ${this.expenses.length === 0 ? 'Add your first expense above!' : 'Try a different filter.'}</p>
                </div>
            `;
            return;
        }

        const expensesHTML = expenses.map(expense => `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-details">
                    <h4>${this.escapeHtml(expense.description)}</h4>
                    <div class="expense-meta">
                        <span class="category">${this.getCategoryDisplay(expense.category)}</span>
                        <span class="date">${this.formatDate(expense.date)}</span>
                    </div>
                </div>
                <div class="expense-right">
                    <div class="expense-amount">-${this.formatCurrency(expense.amount)}</div>
                    <div class="expense-actions">
                        <button class="btn-small btn-edit" onclick="tracker.editExpense('${expense.id}')">
                            Edit
                        </button>
                        <button class="btn-small btn-delete" onclick="tracker.deleteExpense('${expense.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = expensesHTML;
    }

    getCategoryDisplay(category) {
        const categoryEmojis = {
            'food': '🍕 Food & Dining',
            'transportation': '🚗 Transportation',
            'shopping': '🛍️ Shopping',
            'entertainment': '🎬 Entertainment',
            'bills': '📄 Bills & Utilities',
            'health': '🏥 Health & Medical',
            'education': '📚 Education',
            'travel': '✈️ Travel',
            'other': '🔗 Other'
        };
        return categoryEmojis[category] || category;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    resetForm() {
        document.getElementById('expenseForm').reset();
        this.setDefaultDate();
    }

    loadExpenses() {
        try {
            const stored = localStorage.getItem('expenses');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading expenses:', error);
            return [];
        }
    }

    saveExpenses() {
        try {
            localStorage.setItem('expenses', JSON.stringify(this.expenses));
        } catch (error) {
            console.error('Error saving expenses:', error);
            this.showNotification('Error saving data!', 'error');
        }
    }

    exportToCSV() {
        if (this.expenses.length === 0) {
            alert('No expenses to export!');
            return;
        }

        const headers = ['Date', 'Description', 'Category', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...this.expenses.map(expense => [
                expense.date,
                `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes
                this.getCategoryDisplay(expense.category).replace(/[🍕🚗🛍️🎬📄🏥📚✈️🔗]/g, '').trim(),
                expense.amount
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('Expenses exported successfully!', 'success');
        } else {
            alert('Export not supported in this browser');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#6366f1'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Chart functionality
    initCharts() {
        try {
            console.log('Initializing charts...');

            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.error('Chart.js is not loaded!');
                return;
            }

            // Check if canvas elements exist
            const categoryCanvas = document.getElementById('categoryPieChart');
            const trendCanvas = document.getElementById('trendLineChart');
            const monthlyCanvas = document.getElementById('monthlyBarChart');

            if (!categoryCanvas || !trendCanvas || !monthlyCanvas) {
                console.error('Chart canvas elements not found!');
                return;
            }

            this.initCategoryChart();
            this.initTrendChart();
            this.initMonthlyChart();
            this.updateCharts();
            console.log('Charts initialized successfully!');
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    initCategoryChart() {
        try {
            const ctx = document.getElementById('categoryPieChart').getContext('2d');
            this.charts.category = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing category chart:', error);
        }
    }

    initTrendChart() {
        try {
            const ctx = document.getElementById('trendLineChart').getContext('2d');
            this.charts.trend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Daily Spending',
                        data: [],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return '$' + value.toFixed(0);
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing trend chart:', error);
        }
    }

    initMonthlyChart() {
        try {
            const ctx = document.getElementById('monthlyBarChart').getContext('2d');
            this.charts.monthly = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Monthly Spending',
                        data: [],
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderColor: '#6366f1',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return '$' + value.toFixed(0);
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing monthly chart:', error);
        }
    }

    updateCharts() {
        try {
            console.log('Updating charts with', this.expenses.length, 'expenses');
            this.updateCategoryChart();
            this.updateTrendChart();
            this.updateMonthlyChart();
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    updateCategoryChart() {
        try {
            const categoryData = this.getCategoryData();
            const chart = this.charts.category;

            console.log('Category data:', categoryData);

            if (!chart) {
                console.error('Category chart not initialized!');
                return;
            }

            if (categoryData.labels.length === 0) {
                console.log('No category data, showing no data message');
                this.showNoDataMessage('categoryChart');
                return;
            }

            chart.data.labels = categoryData.labels;
            chart.data.datasets[0].data = categoryData.values;
            chart.update();
            console.log('Category chart updated successfully');
        } catch (error) {
            console.error('Error updating category chart:', error);
        }
    } updateTrendChart() {
        const trendData = this.getTrendData();
        const chart = this.charts.trend;

        if (trendData.labels.length === 0) {
            this.showNoDataMessage('trendChart');
            return;
        }

        chart.data.labels = trendData.labels;
        chart.data.datasets[0].data = trendData.values;
        chart.update();
    }

    updateMonthlyChart() {
        const monthlyData = this.getMonthlyData();
        const chart = this.charts.monthly;

        if (monthlyData.labels.length === 0) {
            this.showNoDataMessage('monthlyChart');
            return;
        }

        chart.data.labels = monthlyData.labels;
        chart.data.datasets[0].data = monthlyData.values;
        chart.update();
    }

    getCategoryData() {
        const categoryTotals = {};

        this.expenses.forEach(expense => {
            const category = this.getCategoryDisplay(expense.category);
            categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
        });

        const labels = Object.keys(categoryTotals);
        const values = Object.values(categoryTotals);

        return { labels, values };
    }

    getTrendData() {
        const last30Days = [];
        const dailyTotals = {};

        // Generate last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last30Days.push(dateStr);
            dailyTotals[dateStr] = 0;
        }

        // Calculate daily totals
        this.expenses.forEach(expense => {
            if (dailyTotals.hasOwnProperty(expense.date)) {
                dailyTotals[expense.date] += expense.amount;
            }
        });

        const labels = last30Days.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const values = last30Days.map(date => dailyTotals[date]);

        return { labels, values };
    }

    getMonthlyData() {
        const monthlyTotals = {};
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Get last 6 months
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            months.push({ key: monthKey, label: monthLabel });
            monthlyTotals[monthKey] = 0;
        }

        // Calculate monthly totals
        this.expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;

            if (monthlyTotals.hasOwnProperty(monthKey)) {
                monthlyTotals[monthKey] += expense.amount;
            }
        });

        const labels = months.map(month => month.label);
        const values = months.map(month => monthlyTotals[month.key]);

        return { labels, values };
    }

    switchChart(chartType) {
        // Update active tab
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-chart="${chartType}"]`).classList.add('active');

        // Show selected chart
        document.querySelectorAll('.chart-wrapper').forEach(wrapper => {
            wrapper.classList.remove('active');
        });
        document.getElementById(`${chartType}Chart`).classList.add('active');

        this.currentChart = chartType;
    }

    // Debug method - can be called from browser console
    debugCharts() {
        console.log('=== Chart Debug Info ===');
        console.log('Chart.js available:', typeof Chart !== 'undefined');
        console.log('Expenses count:', this.expenses.length);
        console.log('Charts initialized:', Object.keys(this.charts));
        console.log('Chart elements present:');
        console.log('- categoryPieChart:', !!document.getElementById('categoryPieChart'));
        console.log('- trendLineChart:', !!document.getElementById('trendLineChart'));
        console.log('- monthlyBarChart:', !!document.getElementById('monthlyBarChart'));

        if (this.expenses.length > 0) {
            console.log('Sample expense:', this.expenses[0]);
            console.log('Category data:', this.getCategoryData());
        }

        // Try to force reinitialize
        console.log('Attempting to reinitialize charts...');
        this.initCharts();
    }

    showNoDataMessage(chartId) {
        const chartWrapper = document.getElementById(chartId);
        const canvas = chartWrapper.querySelector('canvas');

        if (!chartWrapper.querySelector('.no-chart-data')) {
            const noDataDiv = document.createElement('div');
            noDataDiv.className = 'no-chart-data';
            noDataDiv.innerHTML = `
                <div class="icon">📊</div>
                <p>No data available</p>
                <small>Add some expenses to see your charts</small>
            `;

            canvas.style.display = 'none';
            chartWrapper.appendChild(noDataDiv);
        }
    }

    // Utility method to get expense statistics for potential future features
    getExpenseStats() {
        const stats = {
            totalExpenses: this.expenses.length,
            totalAmount: this.expenses.reduce((sum, exp) => sum + exp.amount, 0),
            averageExpense: 0,
            categoryBreakdown: {},
            monthlyTrend: {}
        };

        if (stats.totalExpenses > 0) {
            stats.averageExpense = stats.totalAmount / stats.totalExpenses;

            // Category breakdown
            this.expenses.forEach(expense => {
                stats.categoryBreakdown[expense.category] =
                    (stats.categoryBreakdown[expense.category] || 0) + expense.amount;
            });

            // Monthly trend (last 6 months)
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                stats.monthlyTrend[monthKey] = this.expenses
                    .filter(exp => {
                        const expDate = new Date(exp.date);
                        return expDate.getFullYear() === date.getFullYear() &&
                            expDate.getMonth() === date.getMonth();
                    })
                    .reduce((sum, exp) => sum + exp.amount, 0);
            }
        }

        return stats;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tracker = new ExpenseTracker();
});

// Add some keyboard shortcuts for better UX
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to quickly add expense
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('expenseForm');
        if (form) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    }

    // Escape to clear form
    if (e.key === 'Escape') {
        const form = document.getElementById('expenseForm');
        if (form) {
            form.reset();
            window.tracker.setDefaultDate();
        }
    }
});