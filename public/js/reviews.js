document.addEventListener("DOMContentLoaded", function () {
    let reviewOffset = 3; 
    let commentOffset = new Array(1000).fill(1);
    let reviewIdIterator = 2;
    let commentIdIterator = 1;
    
    const loadMoreReviewsButton = document.getElementById("load-more");
    const reviewsContainer = document.getElementById("reviews-container");
    const gameTitle = document.getElementById("game-title").innerText; 
    
    let heartButton = document.querySelectorAll("[id^='heart-']");
    let editButton = document.querySelectorAll("[id^='edit-']");
    let trashButton = document.querySelectorAll("[id^='trash-']");
    let editForm = document.querySelectorAll("[id^='reviewForm-']");
    let replyButton = document.querySelectorAll("[id^='reply-']");
    let commentForm = document.querySelectorAll("[id^='commentForm-']");
    let loadMoreCommentsButton = document.querySelectorAll("[id^='load-more-comments-']");

    heartButton.forEach((button) => {
        button.onclick = async function () {
            const index = button.id.split("-")[1]; 
            const heartCount = document.getElementById(`like-count-${index}`);
            const intergerEquivalent = heartCount.innerText[0] - '0';
            console.log(intergerEquivalent);
            

            await fetch(`/add-like/${encodeURIComponent(gameTitle)}/${index}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
        };
    });
    
    editButton.forEach((button) => {
        button.onclick = async function () {
            const index = button.id.split("-")[1];
            console.log(index);

            document.getElementById(`review-text-${index}`).style.display = "none"; 
            document.getElementById(`review-input-${index}`).removeAttribute("readonly"); 
            document.getElementById(`reviewForm-${index}`).style.display = "block"; 

            const cancelButton = document.getElementById(`cancel-review-edit-${index}`);
            const submitButton = document.getElementById(`submit-review-edit-${index}`);

            submitButton.onclick = function() {
                editForm.forEach((form) => {
                    const index = form.id.split("-")[1]; 
                    var editText = document.getElementById(`review-input-${index}`).value;
            
                    form.action = `/edit-review/${encodeURIComponent(gameTitle)}/${index}/${encodeURIComponent(editText)}`;
                });
            };

            cancelButton.onclick = function() {
                document.getElementById(`review-text-${index}`).style.display = "block"; 
                document.getElementById(`review-input-${index}`).setAttribute("readonly", true); 
                document.getElementById(`reviewForm-${index}`).style.display = "none"; 
            };

        };
    });


    trashButton.forEach((button) => {
        button.onclick = async function () {
            const index = button.id.split("-")[1]; 
            const reviewCard = document.getElementById(`review-card-${index}`);
            reviewCard.style.display = "none";


            await fetch(`/delete-review/${encodeURIComponent(gameTitle)}/${index}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            location.replace(`/review/${encodeURIComponent(gameTitle)}`);
        };
    });

    replyButton.forEach((button) => {
        button.onclick = async function () {
            const index = button.id.split("-")[1]; 
            console.log(index);

            document.getElementById(`comment-input-${index}`).removeAttribute("readonly");
            document.getElementById(`commentForm-${index}`).style.display = "block"; 

            const cancelButton = document.getElementById(`cancel-comment-${index}`);
            const submitButton = document.getElementById(`submit-comment-${index}`);

            submitButton.onclick = function() {
                commentForm.forEach((form) => {
                    const index = form.id.split("-")[1]; 
                    var commentText = document.getElementById(`comment-input-${index}`).value;
                    
                    form.action = `/add-comment/${encodeURIComponent(gameTitle)}/${index}/${encodeURIComponent(commentText)}`;
                });
            };

            cancelButton.onclick = function() {
                document.getElementById(`comment-input-${index}`).setAttribute("readonly", true); 
                document.getElementById(`commentForm-${index}`).style.display = "none"; 
            };

        };
    });

    loadMoreCommentsButton.forEach((button) => {
        button.onclick = async function() {
            try{
                const index = button.id.split("-")[3]; 
                console.log(commentOffset[index]);
                const response = await fetch(`/comments/load/${encodeURIComponent(index)}}/${encodeURIComponent(gameTitle)}?offset=${commentOffset[index]}`);
                const newComments = await response.json();
                var commentsButton = document.getElementById(`load-more-comments-${index}`);
                const commentsContainer = document.getElementById(`comments-container-${index}`);

                console.log(newComments);
                
                if (newComments.length === 0) {
                    commentsButton.style.display = "none";
                    return;
                }

                newComments.forEach((comment) => {
                    commentIdIterator++;
                    const commentHTML = `
                        <div class="comment-card" id="comment-card-{{@index}}">
                            <div class="profile-details">
                                <a href="/profile/${comment.username}">
                                <img src="${comment.profilePicture}" alt="Profile" class="profile-pic">
                                </a>
                                <h4>${comment.username}</h4> 
                            </div>

                            <p id="comment-text-${commentIdIterator}" class="review-text">${comment.commentText}</p>
                        </div>
                    `;

                    console.log(`comments-container-${index}`);
                    commentsContainer.innerHTML += commentHTML;
                });
                commentOffset[index] += 3;
            } catch(error){
                console.error(error);
            }
            
        };
    });

    loadMoreReviewsButton.onclick = async function () {
        try {
            const response = await fetch(`/reviews/load/${encodeURIComponent(gameTitle)}?offset=${reviewOffset}`);
            const newReviews = await response.json();

            console.log(newReviews);

            
            if (newReviews.length === 0) {
                loadMoreReviewsButton.style.display = "none";
                return;
            }

            newReviews.forEach((review) => {
                reviewIdIterator++;
                const reviewHTML = `
                    <div class="review-card" id="review-card-${reviewIdIterator}">
                        <div class="profile-details">
                            <a href="/profile/${review.username}">
                                <img src="${review.profilePicture}" alt="Profile" class="profile-pic">
                            </a>
                            <h4>${review.username}</h4>
                        </div>
                        <div class="review-meta">
                            <h4><span class="stars">${"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}</span></h4>
                            <p><small>${review.date}</small></p>
                        </div>
                        <p id="review-text-${reviewIdIterator}" class="review-text">${review.reviewText}</p>

                        <form id="reviewForm-${reviewIdIterator}" action="" method="POST" style="display: none;" onsubmit="return confirm('Save changes?');">

                            <textarea name="newReview" id="review-input-${reviewIdIterator}" class="bio-input" readonly>${review.reviewText}</textarea>

                            <!-- Button Container -->
                            <div class="bio-buttons">
                                <button type="submit" id="submit-review-edit-${reviewIdIterator}" class="add-review-button">Save</button>
                                <button type="button" id="cancel-review-edit-${reviewIdIterator}" class="add-review-button" onclick="">Cancel</button>
                            </div>
                        </form>

                        <div class="review-actions">
                            <div class="heart-container">
                                <input type="checkbox" id="heart-${reviewIdIterator}" />
                                <label for="heart-${reviewIdIterator}">&#10084;</label>
                                <span class="like-count" id="like-count-${reviewIdIterator}">${review.likes.length} Likes</span>
                            </div>

                            ${review.selfComment ? `
                                <div class="heart-container">
                                    <input type="checkbox" id="edit-${reviewIdIterator}" />  
                                    <label for="edit-${reviewIdIterator}">&#9998;</label>
                                </div>

                                <div class="heart-container">
                                    <input type="checkbox" id="trash-${reviewIdIterator}" />  
                                    <label for="trash-${reviewIdIterator}">&#128465;</label>
                                </div>
                            ` : ''}

                            <div class="heart-container">
                                <input type="button" id="reply-${reviewIdIterator}" />  
                                <label for="reply-${reviewIdIterator}">&#128172;</label>
                                <span class="reply">${review.replies.length}</span>
                            </div>
                        </div>

                        <!--Comment form-->
                        <form id="commentForm-${reviewIdIterator}" action="" method="POST" style="display: none;" onsubmit="return confirm('Save changes?');">

                            <textarea name="newComment" id="comment-input-${reviewIdIterator}" class="bio-input" readonly></textarea>

                            <!-- Button Container -->
                            <div class="bio-buttons">
                                <button type="submit" id="submit-comment-${reviewIdIterator}" class="add-review-button">Save</button>
                                <button type="button" id="cancel-comment-${reviewIdIterator}" class="add-review-button" onclick="">Cancel</button>
                            </div>
                        </form>

                        <div id="comments-container-${reviewIdIterator}">
                        </div>
                                    
                        <button id="load-more-comments-${reviewIdIterator}" class="nav-link">load more comments</button>

                    </div>
                `;
                reviewsContainer.innerHTML += reviewHTML;
                
                if (review.replies.length > 0){
                    const commentHTML = `
                    <div class="comment-card" id="comment-card-{{@index}}">
                        <div class="profile-details">
                            <a href="/profile/${review.replies[0].username}">
                            <img src="${review.replies[0].profilePicture}" alt="Profile" class="profile-pic">
                            </a>
                            <h4>${review.replies[0].username}</h4> 
                        </div>

                        <p id="comment-text-0" class="review-text">${review.replies[0].commentText}</p>
                    </div>
                    `;
                    document.getElementById(`comments-container-${reviewIdIterator}`).innerHTML += commentHTML;
                }
                console.log("works");
            });

            reviewOffset += 3; 
            console.log(reviewOffset);

            
            heartButton = document.querySelectorAll("[id^='heart-']");
            editButton = document.querySelectorAll("[id^='edit-']");
            trashButton = document.querySelectorAll("[id^='trash-']");
            editForm = document.querySelectorAll("[id^='reviewForm-']");
            replyButton = document.querySelectorAll("[id^='reply-']");
            commentForm = document.querySelectorAll("[id^='commentForm-']");
            loadMoreCommentsButton = document.querySelectorAll("[id^='load-more-comments-']");

            console.log("new elements added");

            heartButton.forEach((button) => {
                button.onclick = async function () {
                    const index = button.id.split("-")[1]; 
                    await fetch(`/add-like/${encodeURIComponent(gameTitle)}/${index}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" }
                    });
                };
            });
            
            trashButton.forEach((button) => {
                button.onclick = async function () {
                    const index = button.id.split("-")[1]; 
                    console.log(index);
                    const reviewCard = document.getElementById(`review-card-${index}`);
                    reviewCard.style.display = "none";
        
        
                    await fetch(`/delete-review/${encodeURIComponent(gameTitle)}/${index}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" }
                    });
                    location.replace(`/review/${encodeURIComponent(gameTitle)}`);
                };
            });

            editButton.forEach((button) => {
                button.onclick = async function () {
                    const index = button.id.split("-")[1];
                    console.log(index);
        
                    document.getElementById(`review-text-${index}`).style.display = "none"; 
                    document.getElementById(`review-input-${index}`).removeAttribute("readonly"); 
                    document.getElementById(`reviewForm-${index}`).style.display = "block"; 
        
                    const cancelButton = document.getElementById(`cancel-review-edit-${index}`);
                    const submitButton = document.getElementById(`submit-review-edit-${index}`);
        
                    submitButton.onclick = function() {
                        editForm.forEach((form) => {
                            const index = form.id.split("-")[1];
                            var editText = document.getElementById(`review-input-${index}`).value;
                    
                            form.action = `/edit-review/${encodeURIComponent(gameTitle)}/${index}/${encodeURIComponent(editText)}`;
                        });
                    };
        
                    cancelButton.onclick = function() {
                        document.getElementById(`review-text-${index}`).style.display = "block"; 
                        document.getElementById(`review-input-${index}`).setAttribute("readonly", true); 
                        document.getElementById(`reviewForm-${index}`).style.display = "none"; 
                    };
        
                };
            });

            replyButton.forEach((button) => {
                button.onclick = async function () {
                    const index = button.id.split("-")[1]; 
                    console.log(index);
        
                    document.getElementById(`comment-input-${index}`).removeAttribute("readonly"); 
                    document.getElementById(`commentForm-${index}`).style.display = "block"; 
        
                    const cancelButton = document.getElementById(`cancel-comment-${index}`);
                    const submitButton = document.getElementById(`submit-comment-${index}`);
        
                    submitButton.onclick = function() {
                        commentForm.forEach((form) => {
                            const index = form.id.split("-")[1]; 
                            var commentText = document.getElementById(`comment-input-${index}`).value;
                            
                            form.action = `/add-comment/${encodeURIComponent(gameTitle)}/${index}/${encodeURIComponent(commentText)}`;
                        });
                    };
        
                    cancelButton.onclick = function() {
                        document.getElementById(`comment-input-${index}`).setAttribute("readonly", true); 
                        document.getElementById(`commentForm-${index}`).style.display = "none"; 
                    };
        
                };
            });
        
            loadMoreCommentsButton.forEach((button) => {
                button.onclick = async function() {
                    const index = button.id.split("-")[3]; 
                    const response = await fetch(`/comments/load/${encodeURIComponent(index)}/${encodeURIComponent(gameTitle)}?offset=${commentOffset[index]}`);
                    const newComments = await response.json();
                    var commentsButton = document.getElementById(`load-more-comments-${index}`);
                    const commentsContainer = document.getElementById(`comments-container-${index}`);
        
                    console.log(newComments);
                    
                    if (newComments.length === 0) {
                        commentsButton.style.display = "none";
                        return;
                    }
        
                    newComments.forEach((comment) => {
                        commentIdIterator++;
                        const commentHTML = `
                            <div class="comment-card" id="comment-card-{{@index}}">
                                <div class="profile-details">
                                    <a href="/profile/${comment.username}">
                                    <img src="${comment.profilePicture}" alt="Profile" class="profile-pic">
                                    </a>
                                    <h4>${comment.username}</h4> 
                                </div>
        
                                <p id="comment-text-${commentIdIterator}" class="review-text">${comment.commentText}</p>
                            </div>
                        `;
        
                        console.log(`comments-container-${index}`);
                        commentsContainer.innerHTML += commentHTML;
                    });
                    commentOffset[index] += 3;
                };
            });

        } catch (error) {
            console.error("Error loading more reviews:", error);
        }
    };
    
});

