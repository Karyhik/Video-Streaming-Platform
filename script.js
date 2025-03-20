// Add event listeners when the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add click handler for YouTube logo
    const youtubeLogo = document.querySelector('.youtube');
    youtubeLogo.addEventListener('click', () => {
        window.location.href = 'https://www.youtube.com';
    });

    // Handle search functionality
    const searchBar = document.querySelector('.search-bar');
    const searchButton = document.querySelector('.search-button');
    const voiceButton = document.querySelector('.voice-button');
    const videoPreviews = document.querySelectorAll('.video-preview');
    
    function performSearch() {
        const searchText = searchBar.value.trim().toLowerCase();
        
        // If search is empty, show all videos
        if (searchText === '') {
            videoPreviews.forEach(preview => {
                preview.style.display = 'block';
            });
            return;
        }

        // Filter videos based on search text
        videoPreviews.forEach(preview => {
            const videoTitle = preview.querySelector('.video-title').textContent.toLowerCase();
            const videoChannel = preview.querySelector('.video-channel').textContent.toLowerCase();
            
            // Show/hide videos based on whether they match the search
            if (videoTitle.includes(searchText) || videoChannel.includes(searchText)) {
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        });
    }

    // Voice recognition setup
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            voiceButton.classList.add('listening');
            searchBar.placeholder = 'Listening...';
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            searchBar.value = transcript;
            performSearch();
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            voiceButton.classList.remove('listening');
            searchBar.placeholder = 'Search';
        };

        recognition.onend = function() {
            voiceButton.classList.remove('listening');
            searchBar.placeholder = 'Search';
        };

        voiceButton.addEventListener('click', function() {
            try {
                recognition.start();
            } catch (err) {
                recognition.stop();
                setTimeout(() => recognition.start(), 200);
            }
        });
    } else {
        voiceButton.style.display = 'none';
        console.warn('Speech recognition not supported in this browser');
    }

    // Regular search functionality
    searchButton.addEventListener('click', performSearch);

    // Trigger search when Enter key is pressed in search bar
    searchBar.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Handle hamburger menu
    const hamburgerMenu = document.querySelector('.hamburger');
    const sideBar = document.querySelector('.side-bar');
    
    hamburgerMenu.addEventListener('click', function() {
        sideBar.classList.toggle('collapsed');
        // You would need to add the .collapsed class in your CSS
    });

    // Remove the old notifications handler since we have the new popup functionality
    // Get all popup containers
    const uploadContainer = document.querySelector('.upload-container');
    const appsContainer = document.querySelector('.apps-container');
    const notifyContainer = document.querySelector('.notify-container');

    // Function to handle popup toggling
    function setupPopup(container, popupClass) {
        const popup = container.querySelector(`.${popupClass}`);
        
        container.addEventListener('click', (e) => {
            // Close other popups
            document.querySelectorAll('.upload-popup, .apps-popup, .notifications-popup')
                .forEach(p => {
                    if (p !== popup) {
                        p.classList.remove('show');
                    }
                });
            
            // Toggle current popup
            popup.classList.toggle('show');
            e.stopPropagation();
        });
    }

    // Setup each popup
    setupPopup(uploadContainer, 'upload-popup');
    setupPopup(appsContainer, 'apps-popup');
    setupPopup(notifyContainer, 'notifications-popup');

    // Close popups when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.upload-popup, .apps-popup, .notifications-popup')
            .forEach(popup => popup.classList.remove('show'));
    });

    // Handle video previews
    videoPreviews.forEach(preview => {
        preview.addEventListener('click', function() {
            const videoTitle = this.querySelector('.video-title').textContent;
            alert('Playing video: ' + videoTitle);
        });

        // Add hover effect
        preview.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.transition = 'transform 0.2s';
        });

        preview.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Handle upload menu interactions
    const uploadPopup = document.querySelector('.upload-popup');

    // Show/hide upload popup
    uploadContainer.addEventListener('click', (e) => {
        uploadPopup.style.display = uploadPopup.style.display === 'block' ? 'none' : 'block';
        e.stopPropagation();
    });

    // Handle individual upload options
    document.querySelectorAll('.upload-popup .popup-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = e.currentTarget.querySelector('span').textContent;
            
            switch(action) {
                case 'Upload video':
                    createUploadModal();
                    break;
                    
                case 'Go live':
                    createLiveStreamModal();
                    break;
                    
                case 'Create post':
                    createPostModal();
                    break;
            }
            
            uploadPopup.style.display = 'none';
        });
    });

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (!uploadContainer.contains(e.target)) {
            uploadPopup.style.display = 'none';
        }
    });
});

// Move these declarations to the top of the file, outside any function
let userPosts = [];
let userVideos = [];

// Make deletePost and editPost functions global
window.deletePost = function(index) {
    if (confirm('Are you sure you want to delete this post?')) {
        userPosts.splice(index, 1);
        updateVideoGrid();
    }
};

window.editPost = function(index) {
    const post = userPosts[index];
    const modal = document.createElement('div');
    modal.className = 'post-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Edit Post</h3>
                <button class="close-btn" onclick="this.closest('.post-modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="post-editor">
                    <textarea placeholder="Share your thoughts..." class="post-text">${post.content}</textarea>
                    <div class="post-options">
                        <select class="post-privacy">
                            <option value="public">Public</option>
                            <option value="subscribers">Subscribers</option>
                            <option value="private">Private</option>
                        </select>
                        <button class="post-btn">Update</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const postBtn = modal.querySelector('.post-btn');
    const postText = modal.querySelector('.post-text');

    postBtn.addEventListener('click', () => {
        if (postText.value.trim()) {
            userPosts[index].content = postText.value.trim();
            userPosts[index].timestamp = 'Edited • Just now';
            updateVideoGrid();
            modal.remove();
        } else {
            alert('Please write something to post');
        }
    });
};

function createUploadModal() {
    const modal = document.createElement('div');
    modal.className = 'upload-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Upload video</h3>
                <button class="close-btn" onclick="this.closest('.upload-modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="upload-area" id="uploadArea">
                    <img src="headicons/upload-video.svg" alt="Upload">
                    <p>Drag and drop video files to upload</p>
                    <p>or</p>
                    <label class="select-files-btn">
                        SELECT FILES
                        <input type="file" accept="video/*" style="display: none;" multiple>
                    </label>
                    <p class="small">Your videos will be private until you publish them.</p>
                </div>
                <div class="upload-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress"></div>
                    </div>
                    <p class="file-name"></p>
                    <p class="status">Uploading...</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle file selection and drag/drop
    const uploadArea = modal.querySelector('#uploadArea');
    const fileInput = modal.querySelector('input[type="file"]');
    const progressArea = modal.querySelector('.upload-progress');
    const progressBar = modal.querySelector('.progress');
    const fileName = modal.querySelector('.file-name');
    const status = modal.querySelector('.status');

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        uploadArea.style.display = 'none';
        progressArea.style.display = 'block';
        fileName.textContent = file.name;

        // Create video thumbnail from the uploaded file
        const videoThumbnail = document.createElement('video');
        videoThumbnail.src = URL.createObjectURL(file);
        
        // When video metadata is loaded, capture the thumbnail
        videoThumbnail.onloadeddata = () => {
            // Set video to a point at 25% of its duration for thumbnail
            videoThumbnail.currentTime = videoThumbnail.duration * 0.25;
        };

        videoThumbnail.onseeked = () => {
            // Create a canvas to capture the video frame
            const canvas = document.createElement('canvas');
            canvas.width = videoThumbnail.videoWidth;
            canvas.height = videoThumbnail.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoThumbnail, 0, 0, canvas.width, canvas.height);
            
            // Get the thumbnail as a data URL
            const thumbnailUrl = canvas.toDataURL('image/jpeg');

            // Simulate upload progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    status.textContent = 'Processing...';
                    setTimeout(() => {
                        status.textContent = 'Upload complete!';
                        
                        // Format video duration
                        const duration = Math.floor(videoThumbnail.duration);
                        const minutes = Math.floor(duration / 60);
                        const seconds = duration % 60;
                        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                        // Add the uploaded video to userVideos array with a unique ID
                        const newVideo = {
                            id: 'v_' + Date.now(), // Create unique ID using timestamp
                            title: file.name.replace(/\.[^/.]+$/, ""),
                            thumbnail: thumbnailUrl,
                            duration: formattedDuration,
                            views: '0 views',
                            timestamp: 'Just now',
                            channel: 'Your Channel',
                            videoUrl: URL.createObjectURL(file) // Store video URL
                        };
                        userVideos.unshift(newVideo);
                        
                        updateVideoGrid();
                        
                        // Clean up
                        URL.revokeObjectURL(videoThumbnail.src);
                        setTimeout(() => modal.remove(), 1000);
                    }, 1500);
                }
                progressBar.style.width = `${progress}%`;
            }, 500);
        };
    }
}

function createLiveStreamModal() {
    const modal = document.createElement('div');
    modal.className = 'live-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Go Live</h3>
                <button class="close-btn" onclick="this.closest('.live-modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="stream-setup">
                    <div class="preview-area">
                        <video id="preview" autoplay muted></video>
                        <div class="stream-controls">
                            <button class="control-btn mic-btn">🎤</button>
                            <button class="control-btn camera-btn">📷</button>
                            <button class="control-btn settings-btn">⚙️</button>
                        </div>
                    </div>
                    <div class="stream-info">
                        <input type="text" placeholder="Stream title" class="stream-title">
                        <select class="stream-privacy">
                            <option value="public">Public</option>
                            <option value="unlisted">Unlisted</option>
                            <option value="private">Private</option>
                        </select>
                        <button class="go-live-btn">GO LIVE</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle camera preview
    const video = modal.querySelector('#preview');
    const goLiveBtn = modal.querySelector('.go-live-btn');
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            video.srcObject = stream;
            
            goLiveBtn.addEventListener('click', () => {
                goLiveBtn.textContent = 'LIVE';
                goLiveBtn.style.backgroundColor = 'red';
                alert('You are now live!');
            });
        })
        .catch(() => {
            alert('Please allow camera and microphone access to go live');
            modal.remove();
        });
}

function createPostModal() {
    const modal = document.createElement('div');
    modal.className = 'post-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Create Post</h3>
                <button class="close-btn" onclick="this.closest('.post-modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="post-editor">
                    <textarea placeholder="Share your thoughts..." class="post-text"></textarea>
                    <div class="post-attachments">
                        <button class="attach-btn">📷 Add Photo</button>
                        <button class="attach-btn">📎 Add Link</button>
                    </div>
                    <div class="post-options">
                        <select class="post-privacy">
                            <option value="public">Public</option>
                            <option value="subscribers">Subscribers</option>
                            <option value="private">Private</option>
                        </select>
                        <button class="post-btn">Post</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const postBtn = modal.querySelector('.post-btn');
    const postText = modal.querySelector('.post-text');

    postBtn.addEventListener('click', () => {
        if (postText.value.trim()) {
            // Add the new post to userPosts array
            const newPost = {
                content: postText.value,
                timestamp: 'Just now',
                likes: 0,
                comments: 0
            };
            userPosts.unshift(newPost);
            
            // Update the video grid with the new post
            updateVideoGrid();
            
            modal.remove();
        } else {
            alert('Please write something to post');
        }
    });
}

// Update the originalVideos array with all video URLs
const originalVideos = [
    {
        id: '1st',
        url: 'https://www.youtube.com/watch?v=8zzwUypZiF8',
        title: 'Iyer and Rahul Show Class In Series Opener | HIGHLIGHTS | 1st T20 - BLACKCAPS v India, 2020',
        duration: '10:43'
    },
    {
        id: '2nd',
        url: 'https://www.youtube.com/watch?v=YBk6szEz3Fw',
        title: 'KL Rahul Masterclass | HIGHLIGHTS | 2nd T20 - BLACKCAPS v India, 2020',
        duration: '8:25'
    },
    {
        id: '3rd',
        url: 'https://www.youtube.com/watch?v=8zzwUypZiF8',
        title: 'Williamson 95 off 48, Sharma Heroics | FULL HIGHLIGHTS | BLACKCAPS v India - 3rd T20, 2020',
        duration: '9:34'
    },
    {
        id: '3rd1',
        url: 'https://www.youtube.com/watch?v=YBk6szEz3Fw',
        title: 'Sharma Stars In Thriller | SUPER OVER REPLAY | BLACKCAPS v India - 3rd T20, 2020',
        duration: '12:18'
    },
    {
        id: '4th',
        url: 'https://www.youtube.com/watch?v=8zzwUypZiF8',
        title: 'India Win Another Super Over Thriller | FULL HIGHLIGHTS | BLACKCAPS v India - 4th T20, 2020',
        duration: '11:45'
    },
    {
        id: '5th',
        url: 'https://www.youtube.com/watch?v=YBk6szEz3Fw',
        title: 'Bumrah Magic In Series Finale | FULL HIGHLIGHTS | BLACKCAPS v India - 5th T20, 2020',
        duration: '12:56'
    },
    {
        id: 'odi2',
        url: 'https://www.youtube.com/watch?v=8zzwUypZiF8',
        title: 'Jamieson Shines On Debut, Jadeja Fightback | FULL HIGHLIGHTS | BLACKCAPS v India - 2nd ODI, 2020',
        duration: '6:36'
    },
    {
        id: 'hq720',
        url: 'https://www.youtube.com/watch?v=YBk6szEz3Fw',
        title: 'Record Breaking Chase! | FULL HIGHLIGHTS | BLACKCAPS v India - 1st ODI, 2020',
        duration: '5:34'
    },
    {
        id: 'odi3',
        url: 'https://www.youtube.com/watch?v=8zzwUypZiF8',
        title: 'De Grandhomme 58* off 28 in Finale | FULL HIGHLIGHTS | BLACKCAPS v India - 3rd ODI, 2020',
        duration: '8:57'
    }
];

// Modify the updateVideoGrid function
function updateVideoGrid() {
    const videoGrid = document.querySelector('.video-grid');
    
    // Create HTML for user posts
    const postsHTML = userPosts.map((post, index) => `
        <div class="video-preview post-preview">
            <div class="post-content">
                <div class="channel-picture">
                    <img class="profile-pic" src="headicons/my-channel (1).jpeg">
                </div>
                <div class="post-info">
                    <div class="post-header">
                        <p class="post-text">${post.content}</p>
                        <div class="post-actions">
                            <button onclick="editPost(${index})" class="action-btn edit-btn">
                                <span>✏️</span>
                            </button>
                            <button onclick="deletePost(${index})" class="action-btn delete-btn">
                                <span>🗑️</span>
                            </button>
                        </div>
                    </div>
                    <p class="post-stats">
                        <span>${post.timestamp}</span> • 
                        <span>${post.likes} likes</span> • 
                        <span>${post.comments} comments</span>
                    </p>
                </div>
            </div>
        </div>
    `).join('');

    // Create HTML for user uploaded videos
    const uploadedVideosHTML = userVideos.map(video => `
        <div class="video-preview" onclick="watchVideo('${video.id}')">
            <div class="thumbnail">
                <img class="picture" src="${video.thumbnail}">
                <div class="video-times">${video.duration}</div>
            </div>
            <div class="channel-picture">
                <img class="profile-pic" src="headicons/my-channel (1).jpeg">
            </div>
            <div class="video-info">
                <p class="video-title">${video.title}</p>
                <p class="video-channel">${video.channel}</p>
                <p class="video-stats">${video.views} • ${video.timestamp}</p>
            </div>
        </div>
    `).join('');

    // Create HTML for original YouTube videos
    const originalVideosHTML = originalVideos.map(video => `
        <div class="video-preview" onclick="openYouTubeVideo('${video.url}')">
            <div class="thumbnail">
                <img class="picture" src="${video.id}.webp">
                <div class="video-times">${video.duration}</div>
            </div>
            <div class="channel-picture">
                <img class="profile-pic" src="profile.jpg">
            </div>
            <div class="video-info">
                <p class="video-title">${video.title}</p>
                <p class="video-channel">NZC Cricket</p>
                <p class="video-stats">50M Views • 3 years ago</p>
            </div>
        </div>
    `).join('');

    // Combine all content
    videoGrid.innerHTML = postsHTML + uploadedVideosHTML + originalVideosHTML;
}

// Modify the watchVideo function to handle both uploaded and YouTube videos
window.watchVideo = function(videoId) {
    // First check if it's a YouTube video
    const youtubeVideo = originalVideos.find(v => v.id === videoId);
    if (youtubeVideo) {
        window.location.href = youtubeVideo.url;
        return;
    }

    // If not a YouTube video, handle as an uploaded video
    const uploadedVideo = userVideos.find(v => v.id === videoId);
    if (uploadedVideo) {
        // Create and show the video player modal
        createVideoPlayer(uploadedVideo);
    }
};

// Add this function to handle YouTube video clicks
window.openYouTubeVideo = function(url) {
    window.open(url, '_blank');
};

// Add these features to the video player modal
function createVideoPlayer(video) {
    const modal = document.createElement('div');
    modal.className = 'video-player-modal';
    modal.innerHTML = `
        <div class="video-player-content">
            <div class="video-player-main">
                <div class="video-primary-content">
                    <video controls autoplay>
                        <source src="${video.videoUrl}" type="video/mp4">
                    </video>
                    <div class="video-info">
                        <h1>${video.title}</h1>
                        <div class="video-actions-bar">
                            <div class="video-stats">
                                <span class="views">${video.views}</span>
                                <span class="upload-date">${video.timestamp}</span>
                            </div>
                            <div class="video-actions">
                                <button class="action-btn like-btn">
                                    <span>👍</span> <span class="like-count">0</span>
                                </button>
                                <button class="action-btn dislike-btn">
                                    <span>👎</span>
                                </button>
                                <button class="action-btn share-btn">
                                    <span>↗️ Share</span>
                                </button>
                                <button class="action-btn save-btn">
                                    <span>💾 Save</span>
                                </button>
                                <button class="action-btn more-btn">
                                    <span>⋮</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="channel-info">
                        <div class="channel-header">
                            <img class="channel-pic" src="headicons/my-channel (1).jpeg">
                            <div class="channel-details">
                                <h4>${video.channel}</h4>
                                <span class="subscriber-count">1.2M subscribers</span>
                            </div>
                            <button class="subscribe-btn">Subscribe</button>
                        </div>
                        <div class="video-description">
                            <p>${video.description || 'No description available'}</p>
                            <button class="show-more-btn">SHOW MORE</button>
                        </div>
                    </div>
                    <div class="comments-section">
                        <div class="comments-header">
                            <span class="comments-count">0 Comments</span>
                            <button class="sort-btn">
                                <span>↓ SORT BY</span>
                            </button>
                        </div>
                        <div class="add-comment">
                            <img class="user-pic" src="headicons/my-channel (1).jpeg">
                            <input type="text" placeholder="Add a comment...">
                        </div>
                        <div class="comments-list">
                            <!-- Comments will be added here -->
                        </div>
                    </div>
                </div>
                <div class="video-secondary-content">
                    <div class="related-videos">
                        <!-- Related videos will be added here -->
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add event listeners for interactions
    const likeBtn = modal.querySelector('.like-btn');
    const dislikeBtn = modal.querySelector('.dislike-btn');
    const subscribeBtn = modal.querySelector('.subscribe-btn');
    const commentInput = modal.querySelector('.add-comment input');
    const showMoreBtn = modal.querySelector('.show-more-btn');

    // Like/Dislike functionality
    likeBtn.addEventListener('click', () => {
        if (!likeBtn.classList.contains('active')) {
            likeBtn.classList.add('active');
            dislikeBtn.classList.remove('active');
            const likeCount = likeBtn.querySelector('.like-count');
            likeCount.textContent = parseInt(likeCount.textContent) + 1;
        }
    });

    dislikeBtn.addEventListener('click', () => {
        if (!dislikeBtn.classList.contains('active')) {
            dislikeBtn.classList.add('active');
            likeBtn.classList.remove('active');
            const likeCount = likeBtn.querySelector('.like-count');
            if (likeBtn.classList.contains('active')) {
                likeCount.textContent = parseInt(likeCount.textContent) - 1;
            }
        }
    });

    // Subscribe button
    subscribeBtn.addEventListener('click', () => {
        if (subscribeBtn.classList.contains('subscribed')) {
            subscribeBtn.classList.remove('subscribed');
            subscribeBtn.textContent = 'Subscribe';
        } else {
            subscribeBtn.classList.add('subscribed');
            subscribeBtn.textContent = 'Subscribed';
        }
    });

    // Comment functionality
    commentInput.addEventListener('focus', () => {
        commentInput.parentElement.classList.add('focused');
    });

    // Show more description
    showMoreBtn.addEventListener('click', () => {
        const description = modal.querySelector('.video-description p');
        description.classList.toggle('expanded');
        showMoreBtn.textContent = description.classList.contains('expanded') ? 'SHOW LESS' : 'SHOW MORE';
    });

    // Add related videos
    const relatedVideosContainer = modal.querySelector('.related-videos');
    const relatedVideos = originalVideos
        .filter(v => v.id !== video.id)
        .slice(0, 10);
    
    relatedVideosContainer.innerHTML = relatedVideos.map(video => `
        <div class="related-video" onclick="openYouTubeVideo('${video.url}')">
            <div class="thumbnail">
                <img src="${video.id}.webp">
                <span class="duration">${video.duration}</span>
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p class="channel">${video.channel}</p>
                <p class="stats">50M views • 3 years ago</p>
            </div>
        </div>
    `).join('');

    document.body.appendChild(modal);
} 