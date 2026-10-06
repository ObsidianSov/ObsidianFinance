

/* =========================================================
   OBSIDIAN FINANCE
   Complete Manual Finance Engine
   Version 1.2
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const TRANSACTION_STORAGE_KEY =
    "obsidian_finance_transactions";

const BALANCE_STORAGE_KEY =
    "obsidian_finance_opening_balances";

const ACCOUNTS = [
    "Sterling",
    "Keystone",
    "OPay"
];


/* =========================================================
   STATE
   ========================================================= */

let transactions =
    JSON.parse(
        localStorage.getItem(
            TRANSACTION_STORAGE_KEY
        )
    ) || [];

let openingBalances =
    JSON.parse(
        localStorage.getItem(
            BALANCE_STORAGE_KEY
        )
    ) || {
        Sterling: 0,
        Keystone: 0,
        OPay: 0
    };


/* =========================================================
   STORAGE
   ========================================================= */

function saveTransactions() {

    localStorage.setItem(
        TRANSACTION_STORAGE_KEY,
        JSON.stringify(transactions)
    );

}


function saveOpeningBalances() {

    localStorage.setItem(
        BALANCE_STORAGE_KEY,
        JSON.stringify(openingBalances)
    );

}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatMoney(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }
    ).format(amount);

}


/* =========================================================
   DATE
   ========================================================= */

function getTodayString() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function displayCurrentDate() {

    const element =
        document.getElementById(
            "currentDate"
        );

    if (!element) return;

    const now = new Date();

    element.textContent =
        now.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        ).toUpperCase();

}


/* =========================================================
   ACCOUNT BALANCES
   ========================================================= */

function calculateBalances() {

    const balances = {

        Sterling:
            Number(
                openingBalances.Sterling
            ) || 0,

        Keystone:
            Number(
                openingBalances.Keystone
            ) || 0,

        OPay:
            Number(
                openingBalances.OPay
            ) || 0

    };


    transactions.forEach(
        transaction => {

            const amount =
                Number(
                    transaction.amount
                ) || 0;


            /*
             * INCOME
             *
             * Money enters the account.
             */

            if (
                transaction.type ===
                "Income"
            ) {

                balances[
                    transaction.account
                ] += amount;

            }


            /*
             * EXPENSE
             *
             * Money leaves the account.
             */

            if (
                transaction.type ===
                "Expense"
            ) {

                balances[
                    transaction.account
                ] -= amount;

            }


            /*
             * TRANSFER
             *
             * Money leaves one account
             * and enters another.
             *
             * Total cash does NOT change.
             */

            if (
                transaction.type ===
                "Transfer"
            ) {

                balances[
                    transaction.fromAccount
                ] -= amount;

                balances[
                    transaction.toAccount
                ] += amount;

            }

        }
    );


    return balances;

}


/* =========================================================
   TOTAL CASH
   ========================================================= */

function calculateTotalCash(
    balances
) {

    return (
        balances.Sterling +
        balances.Keystone +
        balances.OPay
    );

}


/* =========================================================
   MONTHLY SUMMARY
   ========================================================= */

function calculateMonthlySummary() {

    const now =
        new Date();

    const currentMonth =
        now.getMonth();

    const currentYear =
        now.getFullYear();


    let income = 0;

    let expenses = 0;


    transactions.forEach(
        transaction => {

            const date =
                new Date(
                    transaction.date
                );


            if (
                date.getMonth() !==
                    currentMonth ||
                date.getFullYear() !==
                    currentYear
            ) {

                return;

            }


            const amount =
                Number(
                    transaction.amount
                ) || 0;


            if (
                transaction.type ===
                "Income"
            ) {

                income += amount;

            }


            if (
                transaction.type ===
                "Expense"
            ) {

                expenses += amount;

            }

        }
    );


    return {

        income,

        expenses,

        net:
            income - expenses

    };

}


/* =========================================================
   UPDATE DASHBOARD
   ========================================================= */

function updateDashboard() {

    const balances =
        calculateBalances();

    const totalCash =
        calculateTotalCash(
            balances
        );

    const monthly =
        calculateMonthlySummary();


    /* -----------------------------------------
       ACCOUNT BALANCES
       ----------------------------------------- */

    const sterling =
        document.getElementById(
            "sterlingBalance"
        );

    const keystone =
        document.getElementById(
            "keystoneBalance"
        );

    const opay =
        document.getElementById(
            "opayBalance"
        );


    if (sterling) {

        sterling.textContent =
            formatMoney(
                balances.Sterling
            );

    }


    if (keystone) {

        keystone.textContent =
            formatMoney(
                balances.Keystone
            );

    }


    if (opay) {

        opay.textContent =
            formatMoney(
                balances.OPay
            );

    }


    /* -----------------------------------------
       TOTAL CASH
       ----------------------------------------- */

    const total =
        document.getElementById(
            "totalCash"
        );


    if (total) {

        total.textContent =
            formatMoney(
                totalCash
            );

    }


    /* -----------------------------------------
       MONTHLY SUMMARY
       ----------------------------------------- */

    const income =
        document.getElementById(
            "monthlyIncome"
        );

    const expenses =
        document.getElementById(
            "monthlyExpenses"
        );

    const net =
        document.getElementById(
            "monthlyNet"
        );


    if (income) {

        income.textContent =
            formatMoney(
                monthly.income
            );

    }


    if (expenses) {

        expenses.textContent =
            formatMoney(
                monthly.expenses
            );

    }


    if (net) {

        net.textContent =
            formatMoney(
                monthly.net
            );

    }


    /* -----------------------------------------
       TRANSACTIONS
       ----------------------------------------- */

    renderTransactions();

}


/* =========================================================
   TRANSACTION DISPLAY
   ========================================================= */

function renderTransactions() {

    const table =
        document.getElementById(
            "transactionTable"
        );


    if (!table) return;


    table.innerHTML = "";


    if (
        transactions.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state"
                >
                    No transactions yet.
                </td>
            </tr>
        `;

        return;

    }


    const sortedTransactions =
        [...transactions].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );


    sortedTransactions.forEach(
        transaction => {

            const row =
                document.createElement(
                    "tr"
                );


            let amountDisplay = "";

            let accountDisplay =
                transaction.account;


            /* -----------------------------------------
               INCOME
               ----------------------------------------- */

            if (
                transaction.type ===
                "Income"
            ) {

                amountDisplay =
                    `+${formatMoney(
                        transaction.amount
                    )}`;

            }


            /* -----------------------------------------
               EXPENSE
               ----------------------------------------- */

            if (
                transaction.type ===
                "Expense"
            ) {

                amountDisplay =
                    `-${formatMoney(
                        transaction.amount
                    )}`;

            }


            /* -----------------------------------------
               TRANSFER
               ----------------------------------------- */

            if (
                transaction.type ===
                "Transfer"
            ) {

                accountDisplay =
                    `${transaction.fromAccount}
                     → 
                     ${transaction.toAccount}`;

                amountDisplay =
                    formatMoney(
                        transaction.amount
                    );

            }


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        transaction.date
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        accountDisplay
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        transaction.description
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        transaction.category
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        transaction.type
                    )}
                </td>

                <td>
                    ${amountDisplay}
                </td>

                <td>

                    <button
                        class="edit-btn"
                        onclick="
                            editTransaction(
                                ${transaction.id}
                            )
                        "
                    >
                        EDIT
                    </button>

                    <button
                        class="delete-btn"
                        onclick="
                            deleteTransaction(
                                ${transaction.id}
                            )
                        "
                    >
                        DELETE
                    </button>

                </td>

            `;


            table.appendChild(row);

        }
    );

}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   DELETE TRANSACTION
   ========================================================= */

function deleteTransaction(id) {

    const transaction =
        transactions.find(
            item =>
                item.id === id
        );


    if (!transaction) {

        return;

    }


    const confirmed =
        confirm(
            `Delete "${transaction.description}"?`
        );


    if (!confirmed) {

        return;

    }


    transactions =
        transactions.filter(
            item =>
                item.id !== id
        );


    saveTransactions();

    updateDashboard();

}


/* =========================================================
   EDIT TRANSACTION
   ========================================================= */

function editTransaction(id) {

    const transaction =
        transactions.find(
            item =>
                item.id === id
        );


    if (!transaction) {

        return;

    }


    transactionModal.classList.add(
        "active"
    );


    transactionForm.dataset.editingId =
        transaction.id;


    document.getElementById(
        "transactionDate"
    ).value =
        transaction.date;


    document.getElementById(
        "transactionType"
    ).value =
        transaction.type;


    document.getElementById(
        "transactionDescription"
    ).value =
        transaction.description;


    document.getElementById(
        "transactionAmount"
    ).value =
        transaction.amount;


    /*
     * Category
     */

    document.getElementById(
        "transactionCategory"
    ).value =
        transaction.category;


    /*
     * Normal account transaction
     */

    const accountElement =
        document.getElementById(
            "transactionAccount"
        );


    if (accountElement) {

        accountElement.value =
            transaction.account || "";

    }


    /*
     * Transfer fields
     */

    const fromElement =
        document.getElementById(
            "transferFromAccount"
        );

    const toElement =
        document.getElementById(
            "transferToAccount"
        );


    if (fromElement) {

        fromElement.value =
            transaction.fromAccount || "";

    }


    if (toElement) {

        toElement.value =
            transaction.toAccount || "";

    }


    updateTransactionFormMode();

}


/* =========================================================
   TRANSACTION MODAL
   ========================================================= */

const transactionModal =
    document.getElementById(
        "transactionModal"
    );

const addTransactionBtn =
    document.getElementById(
        "addTransactionBtn"
    );

const closeModalBtn =
    document.getElementById(
        "closeModalBtn"
    );

const cancelTransactionBtn =
    document.getElementById(
        "cancelTransactionBtn"
    );

const transactionForm =
    document.getElementById(
        "transactionForm"
    );

const transactionDate =
    document.getElementById(
        "transactionDate"
    );

const transactionType =
    document.getElementById(
        "transactionType"
    );


/* =========================================================
   OPEN TRANSACTION MODAL
   ========================================================= */

if (addTransactionBtn) {

    addTransactionBtn.addEventListener(
        "click",
        () => {

            transactionForm.reset();

            delete transactionForm.dataset
                .editingId;

            setDefaultDate();

            updateTransactionFormMode();

            transactionModal.classList.add(
                "active"
            );

        }
    );

}


/* =========================================================
   CLOSE TRANSACTION MODAL
   ========================================================= */

function closeTransactionModal() {

    if (!transactionModal) {

        return;

    }


    transactionModal.classList.remove(
        "active"
    );


    transactionForm.reset();


    delete transactionForm.dataset
        .editingId;


    setDefaultDate();

    updateTransactionFormMode();

}


if (closeModalBtn) {

    closeModalBtn.addEventListener(
        "click",
        closeTransactionModal
    );

}


if (cancelTransactionBtn) {

    cancelTransactionBtn.addEventListener(
        "click",
        closeTransactionModal
    );

}


if (transactionModal) {

    transactionModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                transactionModal
            ) {

                closeTransactionModal();

            }

        }
    );

}


/* =========================================================
   DEFAULT DATE
   ========================================================= */

function setDefaultDate() {

    if (!transactionDate) {

        return;

    }


    transactionDate.value =
        getTodayString();

}


/* =========================================================
   TRANSACTION TYPE UI
   ========================================================= */

function updateTransactionFormMode() {

    const type =
        transactionType?.value;


    const normalAccountGroup =
        document.getElementById(
            "normalAccountGroup"
        );

    const transferFromGroup =
        document.getElementById(
            "transferFromGroup"
        );

    const transferToGroup =
        document.getElementById(
            "transferToGroup"
        );


    /*
     * Transfer
     */

    if (
        type ===
        "Transfer"
    ) {

        if (normalAccountGroup) {

            normalAccountGroup.style.display =
                "none";

        }


        if (transferFromGroup) {

            transferFromGroup.style.display =
                "block";

        }


        if (transferToGroup) {

            transferToGroup.style.display =
                "block";

        }

    }

    /*
     * Income / Expense
     */

    else {

        if (normalAccountGroup) {

            normalAccountGroup.style.display =
                "block";

        }


        if (transferFromGroup) {

            transferFromGroup.style.display =
                "none";

        }


        if (transferToGroup) {

            transferToGroup.style.display =
                "none";

        }

    }

}


if (transactionType) {

    transactionType.addEventListener(
        "change",
        updateTransactionFormMode
    );

}


/* =========================================================
   SAVE TRANSACTION
   ========================================================= */

if (transactionForm) {

    transactionForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const type =
                document.getElementById(
                    "transactionType"
                ).value;


            const amount =
                Number(
                    document.getElementById(
                        "transactionAmount"
                    ).value
                );


            const date =
                document.getElementById(
                    "transactionDate"
                ).value;


            const description =
                document.getElementById(
                    "transactionDescription"
                ).value.trim();


            const category =
                document.getElementById(
                    "transactionCategory"
                ).value;


            /*
             * Basic validation
             */

            if (
                !date ||
                !type ||
                !description ||
                !amount ||
                amount <= 0
            ) {

                alert(
                    "Please complete all required fields."
                );

                return;

            }


            /*
             * EDITING
             */

            const editingId =
                transactionForm.dataset
                    .editingId;


            /*
             * -----------------------------------------
             * TRANSFER
             * -----------------------------------------
             */

            if (
                type ===
                "Transfer"
            ) {

                const fromAccount =
                    document.getElementById(
                        "transferFromAccount"
                    )?.value;


                const toAccount =
                    document.getElementById(
                        "transferToAccount"
                    )?.value;


                if (
                    !fromAccount ||
                    !toAccount
                ) {

                    alert(
                        "Select both accounts."
                    );

                    return;

                }


                if (
                    fromAccount ===
                    toAccount
                ) {

                    alert(
                        "Source and destination accounts must be different."
                    );

                    return;

                }


                const transferTransaction = {

                    id:
                        editingId
                            ? Number(
                                editingId
                            )
                            : Date.now(),

                    date,

                    type:
                        "Transfer",

                    category:
                        "Transfer",

                    description,

                    amount,

                    fromAccount,

                    toAccount

                };


                saveOrUpdateTransaction(
                    transferTransaction,
                    editingId
                );


                return;

            }


            /*
             * -----------------------------------------
             * INCOME / EXPENSE
             * -----------------------------------------
             */

            const account =
                document.getElementById(
                    "transactionAccount"
                ).value;


            if (!account) {

                alert(
                    "Select an account."
                );

                return;

            }


            const normalTransaction = {

                id:
                    editingId
                        ? Number(
                            editingId
                        )
                        : Date.now(),

                date,

                account,

                type,

                category,

                description,

                amount

            };


            saveOrUpdateTransaction(
                normalTransaction,
                editingId
            );

        }
    );

}


/* =========================================================
   SAVE OR UPDATE TRANSACTION
   ========================================================= */

function saveOrUpdateTransaction(
    transaction,
    editingId
) {

    if (editingId) {

        const index =
            transactions.findIndex(
                item =>
                    item.id ===
                    Number(editingId)
            );


        if (index !== -1) {

            transactions[index] =
                transaction;

        }

    }

    else {

        transactions.push(
            transaction
        );

    }


    saveTransactions();

    updateDashboard();

    closeTransactionModal();

}


/* =========================================================
   OPENING BALANCE MODAL
   ========================================================= */

const balanceModal =
    document.getElementById(
        "balanceModal"
    );

const editBalancesBtn =
    document.getElementById(
        "editBalancesBtn"
    );

const closeBalanceModalBtn =
    document.getElementById(
        "closeBalanceModalBtn"
    );

const cancelBalanceBtn =
    document.getElementById(
        "cancelBalanceBtn"
    );

const balanceForm =
    document.getElementById(
        "balanceForm"
    );


/* =========================================================
   OPEN BALANCES
   ========================================================= */

if (editBalancesBtn) {

    editBalancesBtn.addEventListener(
        "click",
        () => {

            document.getElementById(
                "sterlingOpening"
            ).value =
                openingBalances.Sterling;


            document.getElementById(
                "keystoneOpening"
            ).value =
                openingBalances.Keystone;


            document.getElementById(
                "opayOpening"
            ).value =
                openingBalances.OPay;


            balanceModal.classList.add(
                "active"
            );

        }
    );

}


/* =========================================================
   CLOSE BALANCES
   ========================================================= */

function closeBalanceModal() {

    if (!balanceModal) {

        return;

    }


    balanceModal.classList.remove(
        "active"
    );

}


if (closeBalanceModalBtn) {

    closeBalanceModalBtn.addEventListener(
        "click",
        closeBalanceModal
    );

}


if (cancelBalanceBtn) {

    cancelBalanceBtn.addEventListener(
        "click",
        closeBalanceModal
    );

}


if (balanceModal) {

    balanceModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                balanceModal
            ) {

                closeBalanceModal();

            }

        }
    );

}


/* =========================================================
   SAVE OPENING BALANCES
   ========================================================= */

if (balanceForm) {

    balanceForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            openingBalances = {

                Sterling:
                    Number(
                        document.getElementById(
                            "sterlingOpening"
                        ).value
                    ) || 0,

                Keystone:
                    Number(
                        document.getElementById(
                            "keystoneOpening"
                        ).value
                    ) || 0,

                OPay:
                    Number(
                        document.getElementById(
                            "opayOpening"
                        ).value
                    ) || 0

            };


            saveOpeningBalances();

            updateDashboard();

            closeBalanceModal();

        }
    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeApp() {

    displayCurrentDate();

    setDefaultDate();

    updateTransactionFormMode();

    updateDashboard();

}


/* =========================================================
   START
   ========================================================= */

initializeApp();
