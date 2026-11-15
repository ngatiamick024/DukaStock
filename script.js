window.dukaAuthReady.then(function(isLoggedIn) {
    if (!isLoggedIn) return; 

 // DukaStock - Main JavaScript

const productForm = document.getElementById("product-form");
const productList = document.getElementById("product-list");
const restockingAlertsList = document.getElementById("restocking-alerts-list");
const isDashboard = document.querySelector(".dashboard") !== null;
const dashboardNumbers = document.querySelectorAll(".dashboard .number");

// Load saved products safely
let savedProducts = [];

try {
    const storedProducts = JSON.parse(localStorage.getItem("dukastock-products"));
    savedProducts = Array.isArray(storedProducts) ? storedProducts : [];
} catch (error) {
    savedProducts = [];
}

let products = savedProducts.map(function(product) {
    return {
         ...product,
        id: product.id || crypto.randomUUID(),
        price: Number(product.price) || 0,
        buyingCost: Number(product.buyingCost) || 0,
        quantity: Number(product.quantity) || 0,
        alertLevel: product.alertLevel == null ? 5 : Number(product.alertLevel),
        targetStock: product.targetStock == null ? 20 : Number(product.targetStock),
        expiryDate: product.expiryDate || ""
    };
});

function saveProducts() {
    localStorage.setItem("dukastock-products", JSON.stringify(products));
}

function getExpiryStatus(expiryDate) {
    if (!expiryDate) {
        return { message: "Not set", className: "expiry-neutral" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate + "T00:00:00");
    if (Number.isNaN(expiry.getTime())) {
        return { message: "Not set", className: "expiry-neutral" };
    }

    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
        return { message: "Expired", className: "expiry-danger" };
    }
    if (daysLeft <= 7) {
        return { message: "Expiring soon", className: "expiry-warning" };
    }
    return { message: "Safe", className: "expiry-safe" };
}

// Add a product
if (productForm) {
    productForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const nameInput = document.getElementById("product-name");
        const priceInput = document.getElementById("product-price");
        const costInput = document.getElementById("product-cost");
        const quantityInput = document.getElementById("product-quantity");
        const expiryInput = document.getElementById("product-expiry");
        const alertInput = document.getElementById("product-alert-level");
        const targetInput = document.getElementById("product-target-stock");

        const name = nameInput ? nameInput.value.trim() : "";
        const price = priceInput ? Number(priceInput.value) : NaN;
        const buyingCost = costInput ? Number(costInput.value) : NaN;
        const quantity = quantityInput ? Number(quantityInput.value) : NaN;
        const alertLevel = alertInput ? Number(alertInput.value) : 5;
        const targetStock = targetInput ? Number(targetInput.value) : 20;

        if (
            !name ||
            !Number.isFinite(price) || price < 1 ||
            !Number.isFinite(buyingCost) || buyingCost <= 0 ||
            !Number.isInteger(quantity) || quantity < 0 ||
            !Number.isInteger(alertLevel) || alertLevel < 0 ||
            !Number.isInteger(targetStock) || targetStock < 1
        ) {
            alert("Please enter valid product details.");
            return;
        }

        products.push({
            id: crypto.randomUUID(),
            name: name,
            price: price,
            buyingCost: buyingCost,
            quantity: quantity,
            expiryDate: expiryInput ? expiryInput.value : "",
            alertLevel: alertLevel,
            targetStock: targetStock
        });

        saveProducts();
        displayProducts();
        productForm.reset();
    });
}

// Display products and restocking alerts
function displayProducts() {
    const lowStockCount = products.filter(function(product) {
        return Number(product.quantity) <= Number(product.alertLevel ?? 5);
    }).length;

    if (isDashboard) {
        if (dashboardNumbers[0]) dashboardNumbers[0].textContent = products.length;
        if (dashboardNumbers[3]) dashboardNumbers[3].textContent = lowStockCount;
        if (dashboardNumbers[4]) dashboardNumbers[4].textContent = lowStockCount;

        const alertsCount = document.getElementById("restocking-alerts-count");
        if (alertsCount) alertsCount.textContent = lowStockCount;
    }

    if (restockingAlertsList) {
        restockingAlertsList.innerHTML = "";

        products.forEach(function(product) {
            if (Number(product.quantity) <= Number(product.alertLevel ?? 5)) {
                const alertItem = document.createElement("li");
                const targetStock = Number(product.targetStock ?? 20);
                const quantityToBuy = Math.max(0, targetStock - Number(product.quantity));

                alertItem.textContent =
                    product.name + " — Only " + product.quantity +
                    " left. Buy " + quantityToBuy +
                    " more to reach " + targetStock + ".";

                restockingAlertsList.appendChild(alertItem);
            }
        });

        if (restockingAlertsList.children.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.textContent = "All products have sufficient stock.";
            restockingAlertsList.appendChild(emptyItem);
        }
    }

    if (!productList) return;
    productList.innerHTML = "";

    products.forEach(function(product, index) {
        const item = document.createElement("li");
        item.className = "product-card";

        const lowStock = Number(product.quantity) <= Number(product.alertLevel ?? 5);
        const expiryStatus = getExpiryStatus(product.expiryDate);

        const heading = document.createElement("div");
        heading.className = "product-card-heading";

        const name = document.createElement("h3");
        name.className = "product-card-name";
        name.textContent = product.name;

        const stockBadge = document.createElement("span");
        stockBadge.className = lowStock
            ? "stock-badge stock-low"
            : "stock-badge stock-good";
        stockBadge.textContent = lowStock ? "Low stock" : "In stock";

        heading.appendChild(name);
        heading.appendChild(stockBadge);

        const details = document.createElement("div");
        details.className = "product-card-details";

        function addDetail(labelText, valueText, extraClass) {
            const detail = document.createElement("div");
            detail.className = "product-detail";

            const label = document.createElement("span");
            label.className = "product-detail-label";
            label.textContent = labelText;

            const value = document.createElement("strong");
            value.className = "product-detail-value" +
                (extraClass ? " " + extraClass : "");
            value.textContent = valueText;

            detail.appendChild(label);
            detail.appendChild(value);
            details.appendChild(detail);
        }

        addDetail("Buying cost", "KSh " + Number(product.buyingCost || 0).toFixed(2));
        addDetail("Selling price", "KSh " + Number(product.price || 0).toFixed(2));
        addDetail(
            "Stock quantity",
            Number(product.quantity) + " units",
            lowStock ? "low-stock-text" : ""
        );

        const expiryDetail = document.createElement("div");
        expiryDetail.className = "product-detail";

        const expiryLabel = document.createElement("span");
        expiryLabel.className = "product-detail-label";
        expiryLabel.textContent = "Expiry";

        const expiryBadge = document.createElement("span");
        expiryBadge.className = "expiry-badge " + expiryStatus.className;
        expiryBadge.textContent = expiryStatus.message;

        expiryDetail.appendChild(expiryLabel);
        expiryDetail.appendChild(expiryBadge);
        details.appendChild(expiryDetail);

        const settings = document.createElement("p");
        settings.className = "product-card-settings";
        settings.textContent =
            "Alert at " + Number(product.alertLevel ?? 5) +
            " units · Target stock " + Number(product.targetStock ?? 20);

        const actions = document.createElement("div");
        actions.className = "product-card-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "product-edit-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            const newPrice = prompt("Enter the new selling price:", product.price);
            if (newPrice === null || newPrice.trim() === "") return;

            const newBuyingCost = prompt(
                "Enter the new buying cost:", product.buyingCost || 0
            );
            if (newBuyingCost === null || newBuyingCost.trim() === "") return;

            const newQuantity = prompt("Enter the new stock quantity:", product.quantity);
            if (newQuantity === null || newQuantity.trim() === "") return;

            const newExpiryDate = prompt(
                "Enter the new expiry date (YYYY-MM-DD), or leave blank:",
                product.expiryDate || ""
            );
            if (newExpiryDate === null) return;

            const newAlertLevel = prompt(
                "Alert me when stock reaches:", product.alertLevel ?? 5
            );
            if (newAlertLevel === null || newAlertLevel.trim() === "") return;

            const newTargetStock = prompt(
                "Enter the target stock level:", product.targetStock ?? 20
            );
            if (newTargetStock === null || newTargetStock.trim() === "") return;

            if (
                !Number.isFinite(Number(newPrice)) || Number(newPrice) < 1 ||
                !Number.isFinite(Number(newBuyingCost)) || Number(newBuyingCost) <= 0 ||
                !Number.isInteger(Number(newQuantity)) || Number(newQuantity) < 0 ||
                !Number.isInteger(Number(newAlertLevel)) || Number(newAlertLevel) < 0 ||
                !Number.isInteger(Number(newTargetStock)) || Number(newTargetStock) < 1
            ) {
                alert("Please enter valid prices, quantities, and restocking settings.");
                return;
            }

            product.price = Number(newPrice);
            product.buyingCost = Number(newBuyingCost);
            product.quantity = Number(newQuantity);
            product.expiryDate = newExpiryDate.trim();
            product.alertLevel = Number(newAlertLevel);
            product.targetStock = Number(newTargetStock);

            saveProducts();
            displayProducts();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "product-delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            if (confirm("Are you sure you want to delete " + product.name + "?")) {
                products.splice(index, 1);
                saveProducts();
                displayProducts();
            }
        });

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        item.appendChild(heading);
        item.appendChild(details);
        item.appendChild(settings);
        item.appendChild(actions);

        productList.appendChild(item);
    });
}

// Record sales
const salesForm = document.getElementById("sales-form");

if (salesForm) {
    salesForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const productNameInput = document.getElementById("sale-product");
        const quantityInput = document.getElementById("sale-quantity");
        const productName = productNameInput ? productNameInput.value.trim() : "";
        const quantitySold = quantityInput ? Number(quantityInput.value) : NaN;

        const product = products.find(function(item) {
            return item.name.toLowerCase() === productName.toLowerCase();
        });

        if (!product) {
            alert("Product not found. Enter an existing product name.");
            return;
        }

        if (!Number.isInteger(quantitySold) || quantitySold < 1) {
            alert("Enter a valid quantity.");
            return;
        }

        if (quantitySold > Number(product.quantity)) {
            alert("Not enough stock available.");
            return;
        }

        product.quantity = Number(product.quantity) - quantitySold;

        let sales = [];
        try {
            const storedSales = JSON.parse(localStorage.getItem("dukastock-sales"));
            sales = Array.isArray(storedSales) ? storedSales : [];
        } catch (error) {
            sales = [];
        }

        
        sales.push({
            id: crypto.randomUUID(),
            productName: product.name,
            quantity: quantitySold,
            price: Number(product.price),
            buyingCost: Number(product.buyingCost || 0),
            date: new Date().toLocaleString()
        });

        localStorage.setItem("dukastock-sales", JSON.stringify(sales));
        saveProducts();

        displayProducts();
        displaySalesHistory();
        salesForm.reset();

        alert("Sale recorded successfully!");
    });
}

// Sales history and daily report
function displaySalesHistory() {
    let sales = [];
    try {
        const storedSales = JSON.parse(localStorage.getItem("dukastock-sales"));
        sales = Array.isArray(storedSales) ? storedSales : [];
        sales = sales.map(function(sale) {
    return {
        ...sale,
        id: sale.id || crypto.randomUUID()
    };
});

localStorage.setItem("dukastock-sales", JSON.stringify(sales));
    } catch (error) {
        sales = [];
    }

    const salesHistoryBody = document.getElementById("sales-history-body");
    if (salesHistoryBody) salesHistoryBody.innerHTML = "";

    const today = new Date();

const todaysSales = sales.filter(function(sale) {
    const parts = sale.date.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
    );

    if (!parts) return false;

    let day;
    let month;

    if (Number(parts[2]) > 12) {
        month = Number(parts[1]);
        day = Number(parts[2]);
    } else {
        day = Number(parts[1]);
        month = Number(parts[2]);
    }

    const saleDate = new Date(
        Number(parts[3]),
        month - 1,
        day
    );

    return saleDate.toDateString() === today.toDateString();
});
    const totalSales = todaysSales.reduce(function(total, sale) {
        return total + Number(sale.price || 0) * Number(sale.quantity || 0);
    }, 0);

    const totalProfit = todaysSales.reduce(function(total, sale) {
        const revenue = Number(sale.price || 0) * Number(sale.quantity || 0);
        const cost = Number(sale.buyingCost || 0) * Number(sale.quantity || 0);
        return total + revenue - cost;
    }, 0);

    if (isDashboard) {
        if (dashboardNumbers[1]) {
            dashboardNumbers[1].textContent = "KSh " + totalSales.toFixed(2);
        }
        if (dashboardNumbers[2]) {
            dashboardNumbers[2].textContent = "KSh " + totalProfit.toFixed(2);
        }
    }

    const reportExists = document.getElementById("daily-profit-report");

    if (reportExists) {
        const reportTotalSales = document.getElementById("report-total-sales");
        const reportTotalCost = document.getElementById("report-total-cost");
        const reportGrossProfit = document.getElementById("report-gross-profit");
        const reportItemsSold = document.getElementById("report-items-sold");

        if (reportTotalSales) reportTotalSales.textContent = totalSales.toFixed(2);
        if (reportTotalCost) {
            reportTotalCost.textContent = (totalSales - totalProfit).toFixed(2);
        }
        if (reportGrossProfit) reportGrossProfit.textContent = totalProfit.toFixed(2);

        if (reportItemsSold) {
            reportItemsSold.textContent = todaysSales.reduce(function(total, sale) {
                return total + Number(sale.quantity || 0);
            }, 0);
        }
    }

    if (salesHistoryBody) {
        sales.forEach(function(sale) {
            const row = document.createElement("tr");

            const productCell = document.createElement("td");
            productCell.textContent = sale.productName || "";

            const quantityCell = document.createElement("td");
            quantityCell.textContent = Number(sale.quantity || 0);

            const priceCell = document.createElement("td");
            priceCell.textContent = "KSh " + Number(sale.price || 0).toFixed(2);

            const dateCell = document.createElement("td");
            dateCell.textContent = sale.date || "";

            row.appendChild(productCell);
            row.appendChild(quantityCell);
            row.appendChild(priceCell);
            row.appendChild(dateCell);

            salesHistoryBody.appendChild(row);
        });
    }
}

// Initial page render
saveProducts();
displayProducts();
displaySalesHistory();


// Make dashboard alert cards clickable
const lowStockCard = document.getElementById("low-stock-card");
const restockingCard = document.getElementById("restocking-alerts-card");

if (lowStockCard) {
    lowStockCard.style.cursor = "pointer";

    lowStockCard.addEventListener("click", function() {
        window.location.href = "products.html";
    });
}

if (restockingCard) {
    restockingCard.style.cursor = "pointer";

    restockingCard.addEventListener("click", function() {
        const alertsList = document.getElementById("restocking-alerts-list");

        if (alertsList) {
            alertsList.scrollIntoView({ behavior: "smooth" });
        } else {
            window.location.href = "products.html";
        }
    });
}
});


