// scripts/landing_page.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('calendar-month-year');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const backgroundElement = document.querySelector('.landing-background');
    const currentYearSpan = document.getElementById('current-year');

    // --- State ---
    let currentDate = new Date(); // Current date object to track displayed month/year

    // --- Check if Data and API Key Exist ---
    if (typeof availableNewsPages === 'undefined') {
        console.error("Error: 'availableNewsPages' array not found. Check placeholder and GitHub Action.");
        calendarGrid.innerHTML = '<p class="error-message">Could not load news data.</p>';
        // Allow other parts (like background) to potentially load
    }
     // unsplashApiKey should be defined in the HTML <script> tag
    if (typeof unsplashApiKey === 'undefined' || unsplashApiKey === 'YOUR_UNSPLASH_ACCESS_KEY' || !unsplashApiKey) {
         console.warn("Warning: Unsplash API key is missing or not configured in index.html. Dynamic background disabled.");
         setFallbackBackground(); // Use fallback if key is missing
    } else {
         setApiBackground(); // Fetch from API if key looks present
    }

    // --- Functions ---

    /**
     * Sets a fallback background (gradient) if API fails or key is missing.
     */
     function setFallbackBackground() {
        if (backgroundElement) {
            console.log("Setting fallback background.");
            backgroundElement.style.backgroundImage = 'linear-gradient(to bottom right, #1a2938, #3c526a)';
            backgroundElement.style.backgroundColor = '#2b3e50'; // Ensure background color is set
        }
     }


    /**
     * Fetches a background image from the Unsplash API.
     */
    async function setApiBackground() {
        if (!backgroundElement || typeof unsplashApiKey === 'undefined' || unsplashApiKey === 'YOUR_UNSPLASH_ACCESS_KEY' || !unsplashApiKey) {
            setFallbackBackground();
            return;
        }

        // Consider adding more terms relevant to AI or abstract designs
        const queryTerms = ['technology', 'abstract', 'future', 'network', 'circuits', 'AI', 'code', 'data'];
        const randomQuery = queryTerms[Math.floor(Math.random() * queryTerms.length)];
        const apiUrl = `https://api.unsplash.com/photos/random?query=${randomQuery}&orientation=landscape&client_id=${unsplashApiKey}`;

        console.log(`Fetching background from Unsplash: query=${randomQuery}`);

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                // Log specific error from Unsplash if available
                let errorData;
                try {
                     errorData = await response.json();
                     console.error(`Unsplash API Error ${response.status}: ${response.statusText}`, errorData?.errors || '');
                } catch(e) {
                    console.error(`Unsplash API Error ${response.status}: ${response.statusText}`);
                }
                 // Handle specific common errors
                if (response.status === 401) {
                    console.error("API Key Invalid or Missing.");
                } else if (response.status === 403) {
                    console.error("Rate limit likely exceeded, or permissions issue.");
                }
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();

            if (data && data.urls && data.urls.regular) {
                 // Preload image for smoother transition
                const img = new Image();
                img.onload = () => {
                    backgroundElement.style.backgroundImage = `url('${data.urls.regular}')`;
                     console.log("Unsplash background applied.");
                };
                img.onerror = () => {
                    console.error(`Failed to load image URL: ${data.urls.regular}`);
                    setFallbackBackground();
                };
                img.src = data.urls.regular;

            } else {
                console.warn("Unsplash API response did not contain expected image URL.", data);
                throw new Error("Invalid API response format");
            }

        } catch (error) {
            console.error('Failed to fetch or set Unsplash background:', error);
            setFallbackBackground(); // Use fallback on any error
        }
    }

    /**
     * Generates and displays the calendar for the given month and year.
     * (This function remains largely the same as before, as it relies on
     * the 'availableNewsPages' array having dates in YYYY-MM-DD format,
     * which the GitHub Action now provides.)
     * @param {number} year - The full year (e.g., 2024)
     * @param {number} month - The month (0-indexed, 0 = January)
     */
    function generateCalendar(year, month) {
        // Added check to ensure data is loaded before generating
        if (typeof availableNewsPages === 'undefined') {
             console.warn("Skipping calendar generation, news data not loaded.");
            calendarGrid.innerHTML = '<p class="error-message">Could not load news data.</p>';
            return;
        }

        calendarGrid.innerHTML = '<div class="loading-placeholder">Generating Calendar...</div>';

        setTimeout(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const firstDayOfMonth = new Date(year, month, 1);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const startingDayOfWeek = firstDayOfMonth.getDay(); // 0=Sunday

            monthYearDisplay.textContent = firstDayOfMonth.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
             monthYearDisplay.setAttribute('aria-label', `Calendar showing ${monthYearDisplay.textContent}`);

            calendarGrid.innerHTML = ''; // Clear placeholder
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            weekdays.forEach(day => {
                const weekdayCell = document.createElement('div');
                weekdayCell.classList.add('calendar-weekday');
                weekdayCell.textContent = day;
                 weekdayCell.setAttribute('aria-hidden', 'true');
                calendarGrid.appendChild(weekdayCell);
            });
             calendarGrid.setAttribute('role', 'grid');

            for (let i = 0; i < startingDayOfWeek; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.classList.add('calendar-day', 'empty');
                emptyCell.setAttribute('role', 'gridcell');
                 emptyCell.setAttribute('aria-label', 'Empty');
                calendarGrid.appendChild(emptyCell);
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.classList.add('calendar-day');
                dayCell.setAttribute('role', 'gridcell');
                dayCell.textContent = day;

                const cellDate = new Date(year, month, day);
                cellDate.setHours(0, 0, 0, 0);
                const cellDateString = cellDate.toISOString().split('T')[0]; // Format YYYY-MM-DD

                 let accessibleLabel = `${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

                if (cellDate.getTime() === today.getTime()) {
                    dayCell.classList.add('today');
                     accessibleLabel += ', Today';
                }

                // Find news based on the YYYY-MM-DD string
                const newsInfo = availableNewsPages.find(page => page.date === cellDateString);

                if (newsInfo) {
                    dayCell.classList.add('has-news');
                    dayCell.innerHTML = ''; // Clear the number
                    const link = document.createElement('a');
                    link.href = newsInfo.url;
                    link.textContent = day;
                    link.title = `Read news for ${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric'})} - ${newsInfo.title || ''}`.trim();
                     link.setAttribute('aria-label', `News for ${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}${newsInfo.title ? `: ${newsInfo.title}` : ''}`);
                    dayCell.appendChild(link);
                    accessibleLabel += `, News available: ${newsInfo.title || 'Click to read'}`;
                } else {
                    accessibleLabel += ', No news available';
                }
                 dayCell.setAttribute('aria-label', accessibleLabel);
                calendarGrid.appendChild(dayCell);
            }

             calendarGrid.style.animation = 'fadeIn 0.5s ease-in-out'; // Re-apply fade-in
             calendarGrid.addEventListener('animationend', () => { calendarGrid.style.animation = ''; }, { once: true }); // Clean up animation listener


        }, 10); // Small delay
    }

    /** Updates the footer year */
    function updateFooterYear() {
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }


    // --- Event Listeners ---
    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });


    // --- Initialisation ---
    // Background is set automatically based on API key check
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth()); // Generate initial calendar
    updateFooterYear(); // Set footer year
});
