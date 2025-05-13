document.addEventListener('DOMContentLoaded', function() {
            // Initialize date fields with the current date
            const today = new Date();
            document.getElementById('startDate').valueAsDate = today;
            document.getElementById('transactionDate').valueAsDate = today;
            
            // Initialize variables
            let transactions = [];
            let initialBalance = 0;
            let annualInterestRate = 0;
            let dailyInterestRate = 0;
            let monthlyServiceFee = 0;
            
            // Add event listeners
            document.getElementById('addTransaction').addEventListener('click', addTransaction);
            document.getElementById('resetCalculator').addEventListener('click', resetCalculator);
            document.getElementById('generateStatement').addEventListener('click', generateStatement);
            document.getElementById('printStatement').addEventListener('click', printStatement);
            document.getElementById('backToCalculator').addEventListener('click', function() {
                openTab(event, 'calculator');
            });
            
            document.getElementById('initialBalance').addEventListener('change', updateInitialBalance);
            document.getElementById('interestRate').addEventListener('change', updateInterestRate);
            document.getElementById('monthlyServiceFee').addEventListener('change', updateMonthlyServiceFee);
            
            // Functions
            function updateInitialBalance() {
                initialBalance = parseFloat(document.getElementById('initialBalance').value) || 0;
                updateSummary();
            }
            
            function updateInterestRate() {
                annualInterestRate = parseFloat(document.getElementById('interestRate').value) || 0;
                dailyInterestRate = annualInterestRate / 36500; // Divide by 365 days * 100 (for percentage)
                updateSummary();
            }
            
            function updateMonthlyServiceFee() {
                monthlyServiceFee = parseFloat(document.getElementById('monthlyServiceFee').value) || 0;
                updateSummary();
            }
            
            function addTransaction() {
                // Get values from inputs
                const transactionDate = document.getElementById('transactionDate').value;
                if (!transactionDate) {
                    alert('Please select a transaction date');
                    return;
                }
                
                const advanceAmount = parseFloat(document.getElementById('advanceAmount').value) || 0;
                const adjustmentAmount = parseFloat(document.getElementById('adjustmentAmount').value) || 0;
                
                // Calculate loan cash
                // In this example, assuming loan cash is the advance minus adjustments
                const loanCash = calculateLoanCash(advanceAmount, adjustmentAmount);
                
                // Calculate new balance
                let previousBalance = 0;
                
                if (transactions.length > 0) {
                    // Find the latest transaction
                    const latestTransaction = [...transactions].sort((a, b) => {
                        return new Date(b.date) - new Date(a.date);
                    })[0];
                    previousBalance = latestTransaction.outstandingBalance;
                } else {
                    previousBalance = initialBalance;
                }
                
                // Calculate interest for the day
                const dailyInterest = previousBalance * dailyInterestRate;
                
                // Calculate new outstanding balance
                const outstandingBalance = previousBalance + advanceAmount - loanCash + dailyInterest;
                
                // Create transaction object
                const transaction = {
                    date: transactionDate,
                    advanceAmount: advanceAmount,
                    adjustmentAmount: adjustmentAmount,
                    loanCash: loanCash,
                    outstandingBalance: outstandingBalance,
                    dailyInterest: dailyInterest
                };
                
                // Add to transactions array
                transactions.push(transaction);
                
                // Sort transactions by date
                transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
                
                // Update the UI
                renderTransactionsTable();
                updateSummary();
                
                // Clear input fields
                document.getElementById('advanceAmount').value = '';
                document.getElementById('adjustmentAmount').value = '';
            }
            
            function calculateLoanCash(advanceAmount, adjustmentAmount) {
                return advanceAmount - adjustmentAmount;
            }
            
            function renderTransactionsTable() {
                const tableBody = document.getElementById('transactionsTable').querySelector('tbody');
                tableBody.innerHTML = '';
                
                transactions.forEach((transaction, index) => {
                    const row = document.createElement('tr');
                    
                    // Format date
                    const dateObj = new Date(transaction.date);
                    const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
                    
                    row.innerHTML = `
                        <td class="center-align">${formattedDate}</td>
                        <td>${formatCurrency(transaction.advanceAmount)}</td>
                        <td>${formatCurrency(transaction.adjustmentAmount)}</td>
                        <td>${formatCurrency(transaction.loanCash)}</td>
                        <td>${formatCurrency(transaction.outstandingBalance)}</td>
                        <td class="center-align">
                            <button class="delete-btn" data-index="${index}">Delete</button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-index'));
                        deleteTransaction(index);
                    });
                });
            }
            
            function deleteTransaction(index) {
                transactions.splice(index, 1);
                recalculateBalances();
                renderTransactionsTable();
                updateSummary();
            }
            
            function recalculateBalances() {
                let currentBalance = initialBalance;
                
                transactions.forEach(transaction => {
                    // Calculate interest for the day
                    const dailyInterest = currentBalance * dailyInterestRate;
                    
                    // Update balance
                    currentBalance = currentBalance + transaction.advanceAmount - transaction.loanCash + dailyInterest;
                    
                    // Update the transaction
                    transaction.outstandingBalance = currentBalance;
                    transaction.dailyInterest = dailyInterest;
                });
            }
            
            function updateSummary() {
                let totalAdvances = 0;
                let totalAdjustments = 0;
                let totalLoanCash = 0;
                let totalInterest = 0;
                
                transactions.forEach(transaction => {
                    totalAdvances += transaction.advanceAmount;
                    totalAdjustments += transaction.adjustmentAmount;
                    totalLoanCash += transaction.loanCash;
                    totalInterest += transaction.dailyInterest;
                });
                
                document.getElementById('totalAdvances').textContent = formatCurrency(totalAdvances);
                document.getElementById('totalAdjustments').textContent = formatCurrency(totalAdjustments);
                document.getElementById('totalLoanCash').textContent = formatCurrency(totalLoanCash);
                
                let currentBalance = initialBalance;
                if (transactions.length > 0) {
                    currentBalance = transactions[transactions.length - 1].outstandingBalance;
                }
                
                document.getElementById('currentBalance').textContent = formatCurrency(currentBalance);
                document.getElementById('totalInterest').textContent = formatCurrency(totalInterest);
                document.getElementById('totalFees').textContent = formatCurrency(monthlyServiceFee);
            }
            
            function resetCalculator() {
                if (confirm('Are you sure you want to reset the calculator? This will clear all transactions.')) {
                    transactions = [];
                    document.getElementById('initialBalance').value = '';
                    document.getElementById('interestRate').value = '';
                    document.getElementById('monthlyServiceFee').value = '';
                    document.getElementById('loanName').value = '';
                    document.getElementById('borrowerName').value = '';
                    
                    initialBalance = 0;
                    annualInterestRate = 0;
                    dailyInterestRate = 0;
                    monthlyServiceFee = 0;
                    
                    renderTransactionsTable();
                    updateSummary();
                }
            }
            
            function generateStatement() {
                if (transactions.length === 0) {
                    alert('Please add at least one transaction before generating a statement.');
                    return;
                }
                
                // Get date range for statement
                let startDate, endDate;
                
                if (transactions.length > 0) {
                    const dates = transactions.map(t => new Date(t.date));
                    startDate = new Date(Math.min(...dates));
                    endDate = new Date(Math.max(...dates));
                    
                    // Set to beginning and end of month for the statement
                    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                    endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
                }
                
                // Format date for statement header
                const statementDateFormatted = `${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getDate()}, ${endDate.getFullYear()}`;
                document.getElementById('statementDate').textContent = statementDateFormatted;
                
                // Set borrower and loan names
                const borrowerName = document.getElementById('borrowerName').value || 'Borrower';
                const loanName = document.getElementById('loanName').value || 'Loan';
                document.getElementById('statementBorrower').textContent = borrowerName;
                document.getElementById('statementLoanName').textContent = loanName;
                
                // Filter transactions for the month
                const monthlyTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= startDate && transactionDate <= endDate;
                });
                
                // Populate statement table
                const statementTableBody = document.getElementById('statementTable').querySelector('tbody');
                statementTableBody.innerHTML = '';
                
                let totalAdvances = 0;
                let totalAdjustments = 0;
                let totalLoanCash = 0;
                let totalInterest = 0;
                
                // Generate a row for each day of the month
                const daysInMonth = endDate.getDate();
                const statementMonth = endDate.getMonth();
                const statementYear = endDate.getFullYear();
                
                for (let day = 1; day <= daysInMonth; day++) {
                    const currentDate = new Date(statementYear, statementMonth, day);
                    const dateString = currentDate.toISOString().split('T')[0];
                    
                    // Find transaction for this day
                    const dayTransaction = monthlyTransactions.find(t => {
                        return t.date === dateString;
                    });
                    
                    const row = document.createElement('tr');
                    
                    if (dayTransaction) {
                        // Format date
                        const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
                        
                        row.innerHTML = `
                            <td class="center-align">${formattedDate}</td>
                            <td>${formatCurrency(dayTransaction.advanceAmount)}</td>
                            <td>${formatCurrency(dayTransaction.adjustmentAmount)}</td>
                            <td>${formatCurrency(dayTransaction.loanCash)}</td>
                            <td>${formatCurrency(dayTransaction.outstandingBalance)}</td>
                        `;
                        
                        totalAdvances += dayTransaction.advanceAmount;
                        totalAdjustments += dayTransaction.adjustmentAmount;
                        totalLoanCash += dayTransaction.loanCash;
                        totalInterest += dayTransaction.dailyInterest;
                    } else {
                        // Format date
                        const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
                        
                        row.innerHTML = `
                            <td class="center-align">${formattedDate}</td>
                            <td>0.00</td>
                            <td>0.00</td>
                            <td>0.00</td>
                            <td>${monthlyTransactions.length > 0 ? formatCurrency(findBalanceForDate(currentDate)) : '0.00'}</td>
                        `;
                    }
                    
                    statementTableBody.appendChild(row);
                }
                
                // Update statement totals
                document.getElementById('statementTotalAdvances').textContent = formatCurrency(totalAdvances);
                document.getElementById('statementTotalAdjustments').textContent = formatCurrency(totalAdjustments);
                document.getElementById('statementTotalLoanCash').textContent = formatCurrency(totalLoanCash);
                
                // Calculate averages
                const avgAdvances = totalAdvances / daysInMonth;
                const avgAdjustments = totalAdjustments / daysInMonth;
                const avgLoanCash = totalLoanCash / daysInMonth;
                
                document.getElementById('statementAvgAdvances').textContent = formatCurrency(avgAdvances);
                document.getElementById('statementAvgAdjustments').textContent = formatCurrency(avgAdjustments);
                document.getElementById('statementAvgLoanCash').textContent = formatCurrency(avgLoanCash);
                
                // Calculate average balance
                const sumOfBalances = monthlyTransactions.reduce((sum, transaction) => {
                    return sum + transaction.outstandingBalance;
                }, 0);
                
                const avgBalance = sumOfBalances / monthlyTransactions.length || 0;
                document.getElementById('statementAvgBalance').textContent = formatCurrency(avgBalance);
                
                // Update fees and interest
                document.getElementById('statementMonthlyFee').textContent = formatCurrency(monthlyServiceFee);
                document.getElementById('statementTotalInterest').textContent = formatCurrency(totalInterest);
                document.getElementById('statementTotalFees').textContent = formatCurrency(monthlyServiceFee);
                document.getElementById('statementTotalInterestAndFees').textContent = formatCurrency(totalInterest + monthlyServiceFee);
                
                // Show the statement tab
                openTab(event, 'statement');
            }
            
            function findBalanceForDate(date) {
                // Find the most recent transaction before or on the given date
                const validTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate <= date;
                });
                
                if (validTransactions.length === 0) {
                    return initialBalance;
                }
                
                // Sort by date descending
                validTransactions.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });
                
                // Return the balance from the most recent transaction
                return validTransactions[0].outstandingBalance;
            }
            
            function printStatement() {
                window.print();
            }
            
            function formatCurrency(amount) {
                return amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
        });
        
        function openTab(evt, tabName) {
            // Declare all variables
            let i, tabcontent, tablinks;
            
            // Get all elements with class="tabcontent" and hide them
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            
            // Get all elements with class="tablinks" and remove the class "active"
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            
            // Show the current tab, and add an "active" class to the button that opened the tab
            document.getElementById(tabName).style.display = "block";
            if (evt && evt.currentTarget) {
                evt.currentTarget.className += " active";
            }
        }
    
