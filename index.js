const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

// In-memory data storage
const expenses = [];
const predefinedCategories = ["Food", "Travel", "Shopping", "Utilities"];

// Add Expense
app.post('/expenses', (req, res) => {
    const { category, amount, date } = req.body;

    // Validation
    if (!predefinedCategories.includes(category)) {
        return res.json({ status: 'error', data: null, error: 'Invalid category' });
    }
    if (amount <= 0) {
        return res.json({ status: 'error', data: null, error: 'Amount must be positive' });
    }

    const expense = {
        id: expenses.length + 1,
        category,
        amount,
        date: date || new Date().toISOString().split('T')[0],
    };
    expenses.push(expense);

    res.json({ status: 'success', data: expense, error: null });
});

// Get Expenses
app.get('/expenses', (req, res) => {
    const { category, start_date, end_date } = req.query;

    let filteredExpenses = expenses;

    if (category) {
        filteredExpenses = filteredExpenses.filter(e => e.category === category);
    }
    if (start_date || end_date) {
        filteredExpenses = filteredExpenses.filter(e => {
            const expenseDate = new Date(e.date);
            return (!start_date || new Date(start_date) <= expenseDate) &&
                   (!end_date || new Date(end_date) >= expenseDate);
        });
    }

    res.json({ status: 'success', data: filteredExpenses, error: null });
});

// Analyze Spending
app.get('/expenses/analysis', (req, res) => {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryTotals = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {});

    const highestSpendingCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const monthlyTotals = expenses.reduce((acc, e) => {
        const month = e.date.slice(0, 7); // "YYYY-MM"
        acc[month] = (acc[month] || 0) + e.amount;
        return acc;
    }, {});

    res.json({
        status: 'success',
        data: { totalSpent, highestSpendingCategory, monthlyTotals },
        error: null
    });
});

// CRON Job for Summary
cron.schedule('0 0 * * *', () => {
    const today = new Date().toISOString().split('T')[0];
    const dailyTotal = expenses.reduce((sum, e) => {
        return e.date === today ? sum + e.amount : sum;
    }, 0);
    console.log(`Daily Expense Summary for ${today}: $${dailyTotal}`);
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Expense Tracker API is running on http://localhost:${PORT}`);
});
