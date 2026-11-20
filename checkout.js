const checkoutForm = document.querySelector("#checkout-form");
const checkoutMessage = document.querySelector("#checkout-message");
const checkoutItemsContainer = document.querySelector("#checkout-items");
const checkoutSubtotal = document.querySelector("#checkout-subtotal");
const placeOrderButton = document.querySelector("#place-order-button");
const checkoutPriceFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

function readCheckoutItems() {
    const cartPayload = new URLSearchParams(window.location.search).get("cart");
    if (!cartPayload) {
        return [];
    }

    const parsedItems = JSON.parse(cartPayload);
    if (!Array.isArray(parsedItems)) {
        throw new Error("The checkout cart must be a list of products.");
    }

    return parsedItems.map((item) => {
        if (
            !item ||
            typeof item.id !== "string" ||
            typeof item.name !== "string" ||
            !item.name.trim() ||
            typeof item.image !== "string" ||
            !item.image.startsWith("image/") ||
            item.image.includes("..") ||
            !Number.isFinite(item.price) ||
            item.price <= 0 ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1
        ) {
            throw new Error("The checkout cart contains invalid product details.");
        }

        return {
            id: item.id,
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity
        };
    });
}

function showCheckoutError(message) {
    checkoutMessage.textContent = message;
    checkoutMessage.hidden = false;
    checkoutForm.hidden = true;
}

function renderCheckoutItems(items) {
    checkoutItemsContainer.replaceChildren();
    let subtotal = 0;

    items.forEach((item) => {
        subtotal += item.price * item.quantity;

        const row = document.createElement("article");
        row.className = "checkout-item";

        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.name;

        const details = document.createElement("div");
        const name = document.createElement("h3");
        name.textContent = item.name;
        const quantity = document.createElement("p");
        quantity.textContent = `Quantity: ${item.quantity}`;
        details.append(name, quantity);

        const price = document.createElement("strong");
        price.textContent = checkoutPriceFormat.format(item.price * item.quantity);

        row.append(image, details, price);
        checkoutItemsContainer.append(row);
    });

    checkoutSubtotal.textContent = checkoutPriceFormat.format(subtotal);
    placeOrderButton.textContent = `Place demo order · ${checkoutPriceFormat.format(subtotal)}`;
}

let checkoutItems;
try {
    checkoutItems = readCheckoutItems();
} catch (error) {
    console.error("Could not load checkout cart.", error);
    showCheckoutError("We couldn't load your cart. Return to the store and try again.");
}

if (checkoutItems && checkoutItems.length > 0) {
    renderCheckoutItems(checkoutItems);
} else if (checkoutItems) {
    showCheckoutError("Your cart is empty. Return to the store to choose products.");
}

checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!checkoutForm.reportValidity()) {
        return;
    }

    const customerName = checkoutForm.elements.fullName.value.trim();
    checkoutForm.hidden = true;
    checkoutMessage.textContent =
        `Thanks, ${customerName}. This demo order is not sent to the store and no payment was processed.`;
    checkoutMessage.hidden = false;
});
