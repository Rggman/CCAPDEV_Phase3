document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector(".search-input");
    const searchResults = document.querySelector(".search-results");

    if (!searchInput || !searchResults) {
        console.error("Search input or results container not found.");
        return;
    }

    let lastQuery = "";

    searchInput.addEventListener("input", async () => {
        const query = searchInput.value.trim();
        if (!query || query === lastQuery) {
            searchResults.style.display = "none"; 
            return;
        }
        lastQuery = query;

        try {
            const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
            const users = await response.json();

            searchResults.innerHTML = "";
            if (users.length > 0) {
                users.slice(0, 5).forEach(user => {
                    const profilePicture = user.profilePicture || "/default-avatar.png"; 
                    const userItem = document.createElement("div");
                    userItem.classList.add("search-result-item");
                    userItem.innerHTML = `
                        <a href="/profile/${user.username}" class="search-result-link">
                            <img src="${profilePicture}" alt="${user.username}" class="search-result-img">
                            <span>${user.username}</span>
                        </a>
                    `;
                    searchResults.appendChild(userItem);
                });
                searchResults.style.display = "block"; 
            } else {
                searchResults.style.display = "none"; 
            }
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    });

    
    document.addEventListener("click", (event) => {
        if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.style.display = "none";
        }
    });

    
    window.addEventListener("scroll", () => {
        searchResults.style.display = "none";
    });

    
    searchInput.addEventListener("focus", () => {
        if (searchInput.value.trim()) {
            searchResults.style.display = "block";
        }
    });
});
