const galleryImage = document.querySelector("#about-gallery-image");
const galleryCaption = document.querySelector("#about-gallery-caption");
const thumbnailButtons = Array.from(document.querySelectorAll(".gallery-thumbnail"));
const gallery = document.querySelector(".about-image");

let activeIndex = thumbnailButtons.findIndex((button) => button.classList.contains("is-active"));
if (activeIndex < 0) {
    activeIndex = 0;
}
let autoplayTimer = null;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function showGalleryImage(index) {
    activeIndex = (index + thumbnailButtons.length) % thumbnailButtons.length;

    const activeButton = thumbnailButtons[activeIndex];
    galleryImage.src = activeButton.dataset.image;
    galleryImage.alt = activeButton.dataset.alt;
    galleryCaption.textContent = activeButton.dataset.caption;
    galleryImage.classList.toggle("gallery-photo", activeButton.dataset.kind === "photo");

    thumbnailButtons.forEach((button, buttonIndex) => {
        const isActive = buttonIndex === activeIndex;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

thumbnailButtons.forEach((button, index) => {
    button.addEventListener("click", () => showGalleryImage(index));
});

function stopGalleryAutoplay() {
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
}

function startGalleryAutoplay() {
    if (prefersReducedMotion || thumbnailButtons.length < 2 || autoplayTimer !== null) {
        return;
    }

    autoplayTimer = window.setInterval(() => showGalleryImage(activeIndex + 1), 5000);
}

gallery.addEventListener("mouseenter", stopGalleryAutoplay);
gallery.addEventListener("mouseleave", startGalleryAutoplay);
gallery.addEventListener("focusin", stopGalleryAutoplay);
gallery.addEventListener("focusout", (event) => {
    if (!gallery.contains(event.relatedTarget)) {
        startGalleryAutoplay();
    }
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopGalleryAutoplay();
    } else {
        startGalleryAutoplay();
    }
});

startGalleryAutoplay();

const productCards = Array.from(document.querySelectorAll(".products .card"));
const categoryCards = Array.from(document.querySelectorAll(".category-card"));

categoryCards.forEach((button) => {
    button.addEventListener("click", () => {
        const selectedCategory = button.dataset.filter;

        productCards.forEach((card) => {
            card.hidden = selectedCategory !== "all" && card.dataset.category !== selectedCategory;
        });

        categoryCards.forEach((categoryCard) => {
            const isActive = categoryCard === button;
            categoryCard.classList.toggle("is-active", isActive);
            categoryCard.setAttribute("aria-pressed", String(isActive));
        });

        document.querySelector(".products .box").scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

const wishlistTrigger = document.querySelector("#wishlist-trigger");
const cartTrigger = document.querySelector("#cart-trigger");
const wishlistCount = document.querySelector("#wishlist-count");
const cartCount = document.querySelector("#cart-count");
const shopDialog = document.querySelector("#shop-dialog");
const shopDialogTitle = document.querySelector("#shop-dialog-title");
const shopDialogItems = document.querySelector("#shop-dialog-items");
const shopDialogSummary = document.querySelector("#shop-dialog-summary");
const cartItemCount = document.querySelector("#cart-item-count");
const cartSubtotal = document.querySelector("#cart-subtotal");
const checkoutButton = document.querySelector("#checkout-button");
const productRecords = productCards.map((card) => {
    const name = card.querySelector(".product_text h2").textContent.trim();
    const image = card.querySelector(".image img");
    const priceText = card.querySelector(".product_text h3").textContent;
    const price = Number(priceText.replace(/[^0-9.]/g, ""));
    const heart = card.querySelector(".small_card .fa-heart");

    if (!name || !image || !Number.isFinite(price) || !heart) {
        throw new Error("A product is missing its name, image, price, or wishlist control.");
    }

    heart.setAttribute("role", "button");
    heart.setAttribute("tabindex", "0");
    heart.setAttribute("aria-pressed", "false");
    heart.setAttribute("aria-label", `Add ${name} to wishlist`);

    return {
        product: {
            id: name.toLowerCase(),
            name,
            image: image.getAttribute("src"),
            price
        },
        card,
        heart
    };
});
const productRecordsById = new Map(productRecords.map((record) => [record.product.id, record]));
const wishlistItems = new Set();
const cartItems = new Map();
const formatPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});
let shopDialogMode = "cart";

function updateStoreCounts() {
    const totalCartQuantity = Array.from(cartItems.values())
        .reduce((total, item) => total + item.quantity, 0);

    cartCount.textContent = String(totalCartQuantity);
    cartCount.hidden = totalCartQuantity === 0;
    wishlistCount.textContent = String(wishlistItems.size);
    wishlistCount.hidden = wishlistItems.size === 0;
    cartTrigger.setAttribute(
        "aria-label",
        `Open shopping cart, ${totalCartQuantity} ${totalCartQuantity === 1 ? "item" : "items"}`
    );
    wishlistTrigger.setAttribute(
        "aria-label",
        `Open wishlist, ${wishlistItems.size} ${wishlistItems.size === 1 ? "item" : "items"}`
    );
}

function setWishlistState(productId, isSaved) {
    const record = productRecordsById.get(productId);
    if (!record) {
        throw new Error(`Unknown product in wishlist: ${productId}`);
    }

    if (isSaved) {
        wishlistItems.add(productId);
    } else {
        wishlistItems.delete(productId);
    }

    record.heart.classList.toggle("is-favorite", isSaved);
    record.heart.setAttribute("aria-pressed", String(isSaved));
    record.heart.setAttribute(
        "aria-label",
        `${isSaved ? "Remove" : "Add"} ${record.product.name} ${isSaved ? "from" : "to"} wishlist`
    );

    updateStoreCounts();
    if (shopDialog.open && shopDialogMode === "wishlist") {
        renderShopDialog();
    }
}

function addProductToCart(productId) {
    const record = productRecordsById.get(productId);
    if (!record) {
        throw new Error(`Unknown product in shopping cart: ${productId}`);
    }

    const currentItem = cartItems.get(productId);
    cartItems.set(productId, {
        ...record.product,
        quantity: currentItem ? currentItem.quantity + 1 : 1
    });

    updateStoreCounts();
    openShopDialog("cart");
}

function createPanelButton(label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
}

function renderShopDialog() {
    const isCart = shopDialogMode === "cart";
    shopDialogTitle.textContent = isCart ? "Shopping cart" : "Your wishlist";
    shopDialogSummary.hidden = !isCart;
    shopDialogItems.replaceChildren();

    const items = isCart
        ? Array.from(cartItems.values())
        : Array.from(wishlistItems, (productId) => productRecordsById.get(productId).product);

    if (items.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "shop-dialog-empty";

        const icon = document.createElement("i");
        icon.className = isCart ? "fa-solid fa-bag-shopping" : "fa-regular fa-heart";
        icon.setAttribute("aria-hidden", "true");

        const message = document.createElement("p");
        message.textContent = isCart
            ? "Your cart is empty. Find something you love."
            : "Your wishlist is empty. Tap a product heart to save a favorite.";

        const browseLink = document.createElement("a");
        browseLink.href = "#Products";
        browseLink.textContent = "Browse products";
        browseLink.addEventListener("click", () => shopDialog.close());

        emptyState.append(icon, message, browseLink);
        shopDialogItems.append(emptyState);
        updateCartSummary();
        return;
    }

    items.forEach((item) => {
        const row = document.createElement("article");
        row.className = "shop-item";

        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.name;

        const info = document.createElement("div");
        info.className = "shop-item-info";
        const name = document.createElement("h3");
        name.textContent = item.name;
        const price = document.createElement("p");
        price.textContent = formatPrice.format(item.price);
        info.append(name, price);

        const actions = document.createElement("div");
        actions.className = "shop-item-actions";

        if (isCart) {
            const quantity = document.createElement("div");
            quantity.className = "shop-item-quantity";
            const decrease = createPanelButton(
                "-",
                () => updateCartQuantity(item.id, item.quantity - 1)
            );
            decrease.setAttribute("aria-label", `Remove one ${item.name}`);
            const quantityValue = document.createElement("span");
            quantityValue.textContent = String(item.quantity);
            const increase = createPanelButton(
                "+",
                () => updateCartQuantity(item.id, item.quantity + 1)
            );
            increase.setAttribute("aria-label", `Add one ${item.name}`);
            quantity.append(decrease, quantityValue, increase);
            actions.append(quantity);

            const remove = createPanelButton(
                "Remove",
                () => updateCartQuantity(item.id, 0)
            );
            actions.append(remove);
        } else {
            const addToCart = createPanelButton(
                "Add to cart",
                () => addProductToCart(item.id)
            );
            const remove = createPanelButton(
                "Remove",
                () => setWishlistState(item.id, false)
            );
            actions.append(addToCart, remove);
        }

        row.append(image, info, actions);
        shopDialogItems.append(row);
    });

    updateCartSummary();
}

function updateCartSummary() {
    const quantity = Array.from(cartItems.values())
        .reduce((total, item) => total + item.quantity, 0);
    const subtotal = Array.from(cartItems.values())
        .reduce((total, item) => total + item.price * item.quantity, 0);

    cartItemCount.textContent = `${quantity} ${quantity === 1 ? "item" : "items"}`;
    cartSubtotal.textContent = formatPrice.format(subtotal);
    const checkoutItems = Array.from(cartItems.values()).map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity
    }));
    checkoutButton.href = `checkout.html?cart=${encodeURIComponent(JSON.stringify(checkoutItems))}`;
    checkoutButton.hidden = quantity === 0;
}

function updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
        cartItems.delete(productId);
    } else {
        const item = cartItems.get(productId);
        if (!item) {
            throw new Error(`Unknown product in shopping cart: ${productId}`);
        }
        cartItems.set(productId, { ...item, quantity });
    }

    updateStoreCounts();
    renderShopDialog();
}

function openShopDialog(mode) {
    shopDialogMode = mode;
    renderShopDialog();
    wishlistTrigger.setAttribute("aria-expanded", String(mode === "wishlist"));
    cartTrigger.setAttribute("aria-expanded", String(mode === "cart"));

    if (!shopDialog.open) {
        shopDialog.showModal();
    }
}

productRecords.forEach(({ product, heart }) => {
    const toggleWishlist = () => {
        setWishlistState(product.id, !wishlistItems.has(product.id));
    };

    heart.addEventListener("click", toggleWishlist);
    heart.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleWishlist();
        }
    });
});

document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
        const card = button.closest(".card");
        const record = productRecords.find((productRecord) => productRecord.card === card);
        if (!record) {
            throw new Error("Could not find the product for this add-to-cart button.");
        }
        addProductToCart(record.product.id);
    });
});

wishlistTrigger.addEventListener("click", () => openShopDialog("wishlist"));
cartTrigger.addEventListener("click", () => openShopDialog("cart"));
document.querySelector("#shop-dialog-close").addEventListener("click", () => shopDialog.close());
shopDialog.addEventListener("close", () => {
    wishlistTrigger.setAttribute("aria-expanded", "false");
    cartTrigger.setAttribute("aria-expanded", "false");
});
shopDialog.addEventListener("click", (event) => {
    const dialogBounds = shopDialog.getBoundingClientRect();
    const clickedOutsideDialog =
        event.clientX < dialogBounds.left ||
        event.clientX > dialogBounds.right ||
        event.clientY < dialogBounds.top ||
        event.clientY > dialogBounds.bottom;

    if (clickedOutsideDialog) {
        shopDialog.close();
    }
});
updateStoreCounts();
