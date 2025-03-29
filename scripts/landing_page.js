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

    // --- Check if Data Exists ---
    // 'availableNewsPages' should be defined in the HTML <script> tag
    if (typeof availableNewsPages === 'undefined') {
        console.error("Error: 'availableNewsPages' array not found. Did the build process generate it?");
        calendarGrid.innerHTML = '<p class="error-message">Could not load news data.</p>';
        return; // Stop execution if data is missing
    }
     if (typeof localBackgroundImages === 'undefined' || localBackgroundImages.length === 0) {
        console.warn("Warning: 'localBackgroundImages' array is missing or empty. No dynamic background applied.");
    }

    // --- Functions ---

    /**
     * Sets a daily background image.
     * Uses the day of the year to cycle through the localBackgroundImages array.
     */
    function setDailyBackground() {
        if (backgroundElement && typeof localBackgroundImages !== 'undefined' && localBackgroundImages.length > 0) {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 0);
            const diff = now - startOfYear;
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay); // Day number (1-366)

            const imageIndex = (dayOfYear - 1) % localBackgroundImages.length; // Cycle through images
            const imageUrl = localBackgroundImages[imageIndex];

            // Preload image for smoother transition
            const img = new Image();
            img.onload = () => {
                 backgroundElement.style.backgroundImage = `url('${imageUrl}')`;
            };
            img.onerror = () => {
                console.error(`Failed to load background image: ${imageUrl}`);
                // Optional: Set a fallback solid color or gradient
                 backgroundElement.style.backgroundImage = 'linear-gradient(to bottom right, #1a2938, #3c526a)';
            };
            img.src = imageUrl;

        } else if (backgroundElement) {
            // Fallback if no images array defined
             backgroundElement.style.backgroundImage = 'linear-gradient(to bottom right, #1a2938, #3c526a)';
        }
    }

    /**
     * Generates and displays the calendar for the given month and year.
     * @param {number} year - The full year (e.g., 2024)
     * @param {number} month - The month (0-indexed, 0 = January)
     */
    function generateCalendar(year, month) {
        calendarGrid.innerHTML = '<div class="loading-placeholder">Generating Calendar...</div>'; // Show loading state

        // Timeout allows the loading message to render before potentially heavy computation
        setTimeout(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize today's date

            const firstDayOfMonth = new Date(year, month, 1);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const startingDayOfWeek = firstDayOfMonth.getDay(); // 0=Sunday, 1=Monday,...

            // Update Month/Year display
            monthYearDisplay.textContent = firstDayOfMonth.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
            monthYearDisplay.setAttribute('aria-label', `Calendar showing ${monthYearDisplay.textContent}`);


            // Clear previous grid content and add weekday headers
            calendarGrid.innerHTML = ''; // Clear placeholder
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            weekdays.forEach(day => {
                const weekdayCell = document.createElement('div');
                weekdayCell.classList.add('calendar-weekday');
                weekdayCell.textContent = day;
                 weekdayCell.setAttribute('aria-hidden', 'true'); // Hide from screen readers as grid has role
                calendarGrid.appendChild(weekdayCell);
            });

             calendarGrid.setAttribute('role', 'grid'); // ARIA role for grid structure


            // Create empty cells for days before the 1st of the month
            for (let i = 0; i < startingDayOfWeek; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.classList.add('calendar-day', 'empty');
                emptyCell.setAttribute('role', 'gridcell'); // ARIA role
                emptyCell.setAttribute('aria-label', 'Empty'); // ARIA label
                calendarGrid.appendChild(emptyCell);
            }

            // Create cells for each day of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.classList.add('calendar-day');
                dayCell.setAttribute('role', 'gridcell'); // ARIA role
                dayCell.textContent = day; // Set the day number first

                const cellDate = new Date(year, month, day);
                cellDate.setHours(0, 0, 0, 0); // Normalize cell date
                const cellDateString = cellDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

                 let accessibleLabel = `${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;


                // Check if today's date matches
                if (cellDate.getTime() === today.getTime()) {
                    dayCell.classList.add('today');
                     accessibleLabel += ', Today';
                }

                // Check if there's a news page for this date
                const newsInfo = availableNewsPages.find(page => page.date === cellDateString);

                if (newsInfo) {
                    dayCell.classList.add('has-news');
                    dayCell.innerHTML = ''; // Clear the number before adding link
                    const link = document.createElement('a');
                    link.href = newsInfo.url;
                    link.textContent = day; // Put day number inside the link
                     link.title = `Read news for ${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric'})}`; // Tooltip
                      accessibleLabel += `, News available: ${newsInfo.title || 'Click to read'}`;
                     link.setAttribute('aria-label', `News for ${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`);
                    dayCell.appendChild(link);
                } else {
                    accessibleLabel += ', No news available';
                }

                dayCell.setAttribute('aria-label', accessibleLabel);
                calendarGrid.appendChild(dayCell);

            }
             calendarGrid.style.animation = 'fadeIn 0.5s ease-in-out'; // Re-apply fade-in
             calendarGrid.addEventListener('animationend', () => { calendarGrid.style.animation = ''; }); // Clean up animation

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
    setDailyBackground(); // Set initial background
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth()); // Generate initial calendar view
    updateFooterYear(); // Set footer year
});
