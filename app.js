/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const SUPABASE_URL = "https://awujqukjvnotenramrhs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3dWpxdWtqdm5vdGVucmFtcmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NzM0NTIsImV4cCI6MjEwNjI0OTQ1Mn0.HvEOmgMu2h10aZASVPbm2nYRB_mGFnx9JxXo0OoCxPM";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let selectedMonth = new Date();
let calendarMonth = new Date();

let transactions = [];
let wishlist = [];
let reminders = [];


/* =========================================================
   HELPERS
   ========================================================= */

const rupiah = amount => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(amount || 0);
};

const todayISO = () => {
    return new Date().toISOString().split("T")[0];
};

const monthString = date => {
    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;
};


/* =========================================================
   THEME
   ========================================================= */

const themeToggle = document.getElementById("themeToggle");

function loadTheme() {

    const theme = localStorage.getItem("theme");

    if (theme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "☀";
    } else {
        themeToggle.textContent = "☾";
    }
}

themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "theme",
        dark ? "dark" : "light"
    );

    themeToggle.textContent =
        dark ? "☀" : "☾";
});

loadTheme();


/* =========================================================
   INITIAL DATE
   ========================================================= */

document.getElementById("currentMonth").value =
    monthString(selectedMonth);

document.getElementById("salaryDate").value =
    todayISO();

document.getElementById("transactionDate").value =
    todayISO();


/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadAllData() {

    await Promise.all([
        loadTransactions(),
        loadWishlist(),
        loadReminders()
    ]);

    updateDashboard();
    renderTransactions();
    renderWishlist();
    renderCalendar();
    renderReminders();
}


/* =========================================================
   TRANSACTIONS
   ========================================================= */

async function loadTransactions() {

    const { data, error } =
        await supabaseClient
            .from("transactions")
            .select("*")
            .order("date", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    transactions = data || [];
}


document
    .getElementById("transactionForm")
    .addEventListener("submit", async e => {

        e.preventDefault();

        const transaction = {

            type:
                document.getElementById(
                    "transactionType"
                ).value,

            category:
                document.getElementById(
                    "transactionCategory"
                ).value,

            amount:
                Number(
                    document.getElementById(
                        "transactionAmount"
                    ).value
                ),

            date:
                document.getElementById(
                    "transactionDate"
                ).value,

            note:
                document.getElementById(
                    "transactionNote"
                ).value

        };

        const { error } =
            await supabaseClient
                .from("transactions")
                .insert([transaction]);

        if (error) {

            alert(
                "Gagal menyimpan transaksi: " +
                error.message
            );

            return;
        }

        e.target.reset();

        document.getElementById(
            "transactionDate"
        ).value = todayISO();

        await loadTransactions();

        updateDashboard();
        renderTransactions();
    });


function renderTransactions() {

    const container =
        document.getElementById(
            "transactionList"
        );

    if (!transactions.length) {

        container.innerHTML = `
            <div class="empty-state">
                Belum ada transaksi.
            </div>
        `;

        return;
    }

    container.innerHTML =
        transactions.map(t => {

            const isIncome =
                t.type === "income";

            return `
                <div class="transaction">

                    <div class="transaction-left">

                        <div class="transaction-icon">
                            ${isIncome ? "↑" : "↓"}
                        </div>

                        <div>
                            <strong>
                                ${t.note || t.category}
                            </strong>

                            <br>

                            <small>
                                ${t.category} · ${t.date}
                            </small>
                        </div>

                    </div>

                    <strong class="${isIncome ? "income" : "expense"}">
                        ${isIncome ? "+" : "-"}
                        ${rupiah(t.amount)}
                    </strong>

                </div>
            `;

        }).join("");
}


/* =========================================================
   WISHLIST
   ========================================================= */

async function loadWishlist() {

    const { data, error } =
        await supabaseClient
            .from("wishlist")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(error);
        return;
    }

    wishlist = data || [];
}


document
    .getElementById("wishlistForm")
    .addEventListener("submit", async e => {

        e.preventDefault();

        const item = {

            name:
                document.getElementById(
                    "wishlistName"
                ).value,

            price:
                Number(
                    document.getElementById(
                        "wishlistPrice"
                    ).value
                ),

            priority:
                document.getElementById(
                    "wishlistPriority"
                ).value

        };

        const { error } =
            await supabaseClient
                .from("wishlist")
                .insert([item]);

        if (error) {

            alert(
                "Gagal menyimpan wishlist: " +
                error.message
            );

            return;
        }

        e.target.reset();

        await loadWishlist();

        renderWishlist();
    });


function renderWishlist() {

    const container =
        document.getElementById(
            "wishlistList"
        );

    if (!wishlist.length) {

        container.innerHTML = `
            <div class="empty-state">
                Wishlist masih kosong.
            </div>
        `;

        return;
    }

    container.innerHTML =
        wishlist.map(item => {

            let priorityLabel;

            if (item.priority === "perlu") {
                priorityLabel = "PERLU";
            } else if (item.priority === "mungkin") {
                priorityLabel = "MUNGKIN";
            } else {
                priorityLabel = "BELUM TERLALU";
            }

            return `
                <div class="wishlist-item">

                    <strong>
                        ${item.name}
                    </strong>

                    <p class="muted">
                        ${rupiah(item.price)}
                    </p>

                    <span class="priority">
                        ${priorityLabel}
                    </span>

                </div>
            `;

        }).join("");
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

    const month =
        document.getElementById(
            "currentMonth"
        ).value;

    const currentTransactions =
        transactions.filter(t =>
            t.date.startsWith(month)
        );

    const income =
        currentTransactions
            .filter(t => t.type === "income")
            .reduce(
                (sum, t) =>
                    sum + Number(t.amount),
                0
            );

    const expense =
        currentTransactions
            .filter(t => t.type === "expense")
            .reduce(
                (sum, t) =>
                    sum + Number(t.amount),
                0
            );

    document.getElementById(
        "totalIncome"
    ).textContent = rupiah(income);

    document.getElementById(
        "totalExpense"
    ).textContent = rupiah(expense);

    document.getElementById(
        "balance"
    ).textContent = rupiah(
        income - expense
    );

    const budget =
        getCurrentBudget();

    document.getElementById(
        "remainingBudget"
    ).textContent = rupiah(
        budget - expense
    );
}


/* =========================================================
   BUDGET
   ========================================================= */

let currentBudget = 0;

function getCurrentBudget() {

    return Number(
        localStorage.getItem(
            "currentBudget"
        ) || 0
    );
}

document
    .getElementById("budgetForm")
    .addEventListener("submit", async e => {

        e.preventDefault();

        const needs =
            Number(
                document.getElementById(
                    "needsBudget"
                ).value
            );

        const saving =
            Number(
                document.getElementById(
                    "savingBudget"
                ).value
            );

        const investment =
            Number(
                document.getElementById(
                    "investmentBudget"
                ).value
            );

        const entertainment =
            Number(
                document.getElementById(
                    "entertainmentBudget"
                ).value
            );

        const total =
            needs +
            saving +
            investment +
            entertainment;

        localStorage.setItem(
            "currentBudget",
            total
        );

        updateDashboard();

        alert(
            "Budget berhasil disimpan: " +
            rupiah(total)
        );
    });


/* =========================================================
   SALARY
   ========================================================= */

document
    .getElementById("salaryForm")
    .addEventListener("submit", async e => {

        e.preventDefault();

        const amount =
            Number(
                document.getElementById(
                    "salaryAmount"
                ).value
            );

        const date =
            document.getElementById(
                "salaryDate"
            ).value;

        const { error } =
            await supabaseClient
                .from("transactions")
                .insert([{

                    type: "income",

                    category: "Gaji",

                    amount,

                    date,

                    note: "Gaji bulanan"

                }]);

        if (error) {

            alert(
                "Gagal menyimpan gaji: " +
                error.message
            );

            return;
        }

        await loadTransactions();

        updateDashboard();
        renderTransactions();

        alert("Gaji berhasil dicatat.");
    });


/* =========================================================
   MONTH CHANGE
   ========================================================= */

document
    .getElementById("currentMonth")
    .addEventListener("change", () => {

        selectedMonth =
            new Date(
                document.getElementById(
                    "currentMonth"
                ).value + "-01"
            );

        updateDashboard();
    });


/* =========================================================
   REMINDERS
   ========================================================= */

async function loadReminders() {

    const { data, error } =
        await supabaseClient
            .from("reminders")
            .select("*")
            .order("date", {
                ascending: true
            });

    if (error) {

        console.error(error);
        return;
    }

    reminders = data || [];
}


const modal =
    document.getElementById(
        "reminderModal"
    );

document
    .getElementById("addReminderBtn")
    .addEventListener("click", () => {

        modal.classList.remove("hidden");

    });

document
    .getElementById("closeModal")
    .addEventListener("click", () => {

        modal.classList.add("hidden");

    });


document
    .getElementById("reminderForm")
    .addEventListener("submit", async e => {

        e.preventDefault();

        const reminder = {

            title:
                document.getElementById(
                    "reminderTitle"
                ).value,

            date:
                document.getElementById(
                    "reminderDate"
                ).value,

            amount:
                Number(
                    document.getElementById(
                        "reminderAmount"
                    ).value || 0
                )

        };

        const { error } =
            await supabaseClient
                .from("reminders")
                .insert([reminder]);

        if (error) {

            alert(
                "Gagal membuat pengingat: " +
                error.message
            );

            return;
        }

        e.target.reset();

        modal.classList.add("hidden");

        await loadReminders();

        renderCalendar();
        renderReminders();
    });


/* =========================================================
   CALENDAR
   ========================================================= */

document
    .getElementById("prevMonth")
    .addEventListener("click", () => {

        calendarMonth.setMonth(
            calendarMonth.getMonth() - 1
        );

        renderCalendar();
        renderReminders();
    });


document
    .getElementById("nextMonth")
    .addEventListener("click", () => {

        calendarMonth.setMonth(
            calendarMonth.getMonth() + 1
        );

        renderCalendar();
        renderReminders();
    });


function renderCalendar() {

    const calendar =
        document.getElementById(
            "calendar"
        );

    const year =
        calendarMonth.getFullYear();

    const month =
        calendarMonth.getMonth();

    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    const title =
        calendarMonth.toLocaleDateString(
            "id-ID",
            {
                month: "long",
                year: "numeric"
            }
        );

    document.getElementById(
        "calendarTitle"
    ).textContent = title;


    calendar.innerHTML = "";


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "calendar-day other-month";

        calendar.appendChild(empty);
    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            document.createElement(
                "div"
            );

        cell.className =
            "calendar-day";


        const date =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;


        if (date === todayISO()) {

            cell.classList.add(
                "today"
            );
        }


        cell.innerHTML = `
            <div class="day-number">
                ${day}
            </div>
        `;


        const dayReminders =
            reminders.filter(
                r => r.date === date
            );


        dayReminders.forEach(r => {

            const reminder =
                document.createElement(
                    "div"
                );

            reminder.className =
                "reminder-dot";

            reminder.textContent =
                r.title;

            cell.appendChild(
                reminder
            );

        });


        calendar.appendChild(cell);
    }
}


function renderReminders() {

    const container =
        document.getElementById(
            "reminderList"
        );

    const year =
        calendarMonth.getFullYear();

    const month =
        calendarMonth.getMonth();


    const monthReminders =
        reminders.filter(r => {

            const date =
                new Date(r.date);

            return (
                date.getFullYear() === year &&
                date.getMonth() === month
            );

        });


    if (!monthReminders.length) {

        container.innerHTML = `
            <div class="empty-state">
                Tidak ada pengingat bulan ini.
            </div>
        `;

        return;
    }


    container.innerHTML =
        monthReminders.map(r => {

            return `
                <div class="reminder">

                    <div>
                        <strong>
                            ${r.title}
                        </strong>

                        <small>
                            ${r.date}
                        </small>
                    </div>

                    <strong>
                        ${r.amount
                            ? rupiah(r.amount)
                            : ""
                        }
                    </strong>

                </div>
            `;

        }).join("");
}


/* =========================================================
   START
   ========================================================= */

loadAllData();
