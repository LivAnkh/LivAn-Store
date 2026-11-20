const galleryImage = document.querySelector("#about-gallery-image");
const galleryCaption = document.querySelector("#about-gallery-caption");
const thumbnailButtons = Array.from(document.querySelectorAll(".gallery-thumbnail"));
const previousButton = document.querySelector(".gallery-previous");
const nextButton = document.querySelector(".gallery-next");

let activeIndex = thumbnailButtons.findIndex((button) => button.classList.contains("is-active"));
if (activeIndex < 0) {
    activeIndex = 0;
}

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

previousButton.addEventListener("click", () => showGalleryImage(activeIndex - 1));
nextButton.addEventListener("click", () => showGalleryImage(activeIndex + 1));

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
