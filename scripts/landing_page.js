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
        if (calendarGrid) { // Check if calendarGrid exists before modifying
             calendarGrid.innerHTML = '<p class="error-message" style="color: red; text-align: center; grid-column: 1 / -1;">Could not load news data.</p>';
        }
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
        if (!backgroundElement) return; // Exit if background element doesn't exist

        if (typeof localBackgroundImages !== 'undefined' && localBackgroundImages.length > 0) {
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
                // Fallback gradient if image fails
                 backgroundElement.style.backgroundImage = 'linear-gradient(to bottom right, #1a2938, #3c526a)';
            };
            img.src = imageUrl;

        } else {
            // Fallback gradient if no images array defined or is empty
             backgroundElement.style.backgroundImage = 'linear-gradient(to bottom right, #1a2938, #3c526a)';
        }
    }

    /**
     * Generates and displays the calendar for the given month and year.
     * @param {number} year - The full year (e.g., 2024)
     * @param {number} month - The month (0-indexed, 0 = January)
     */
    function generateCalendar(year, month) {
        // Check if core elements exist
        if (!calendarGrid || !monthYearDisplay) {
            console.error("Calendar elements (grid or month/year display) not found.");
            return;
        }

        calendarGrid.innerHTML = '<div class="loading-placeholder" style="grid-column: 1 / -1;">Generating Calendar...</div>'; // Show loading state

        // Timeout allows the loading message to render before potentially heavy computation
        setTimeout(() => {
            try { // Add error handling for calendar generation
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize today's date

                const firstDayOfMonth = new Date(year, month, 1);
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                let startingDayOfWeek = firstDayOfMonth.getDay(); // 0=Sunday, 1=Monday,...

                 // Adjust if your week starts on Monday (Optional)
                 // startingDayOfWeek = (startingDayOfWeek === 0) ? 6 : startingDayOfWeek - 1; // Uncomment if Sunday is 0 and you want Monday as the first column

                // Update Month/Year display
                monthYearDisplay.textContent = firstDayOfMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                });
                monthYearDisplay.setAttribute('aria-label', `Calendar showing ${monthYearDisplay.textContent}`);


                // Clear previous grid content and add weekday headers
                calendarGrid.innerHTML = ''; // Clear placeholder
                const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                // If starting week on Monday: const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
                    dayCell.textContent = day; // Set the day number initially

                    const cellDate = new Date(year, month, day); // Still needed for 'today' check and full date labels
                    cellDate.setHours(0, 0, 0, 0); // Normalize cell date

                    // --- MODIFIED PART: Create YYYY-MM-DD string directly ---
                    const currentMonth = (month + 1).toString().padStart(2, '0'); // month is 0-indexed, add 1, pad with '0'
                    const currentDay = day.toString().padStart(2, '0'); // Pad day with '0'
                    const cellDateString = `${year}-${currentMonth}-${currentDay}`; // Construct the string like "2024-03-29"
                    // --- END OF MODIFIED PART ---

                    let accessibleLabel = `${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

                    // Check if today's date matches
                    if (cellDate.getTime() === today.getTime()) {
                        dayCell.classList.add('today');
                        accessibleLabel += ', Today';
                    }

                    // Check if there's a news page for this date using the correctly formatted string
                    const newsInfo = availableNewsPages.find(page => page.date === cellDateString);

                    if (newsInfo) {
                        dayCell.classList.add('has-news');
                        dayCell.innerHTML = ''; // Clear the number text before adding link
                        const link = document.createElement('a');
                        link.href = newsInfo.url;
                        link.textContent = day; // Put day number inside the link
                        link.title = `Read news for ${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`; // Tooltip
                        accessibleLabel += `, News available: ${newsInfo.title || 'Click to read'}`;
                        link.setAttribute('aria-label', `News for ${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`);
                        dayCell.appendChild(link);
                    } else {
                        accessibleLabel += ', No news available';
                    }

                    dayCell.setAttribute('aria-label', accessibleLabel);
                    calendarGrid.appendChild(dayCell);
                } // End of day loop

                // Re-apply fade-in animation (optional aesthetic)
                 calendarGrid.style.animation = 'none'; // Reset animation first
                 requestAnimationFrame(() => { // Wait for next frame repaint
                     setTimeout(() => { // Needed for reset to take effect reliably
                          calendarGrid.style.animation = 'fadeIn 0.5s ease-in-out';
                     }, 0);
                 });

             } catch (error) {
                console.error("Error during calendar generation:", error);
                calendarGrid.innerHTML = '<p class="error-message" style="color: orange; text-align: center; grid-column: 1 / -1;">Error displaying calendar.</p>';
            }

        }, 10); // Small delay for loading message render
    }


    /** Updates the footer year */
    function updateFooterYear() {
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }


    // --- Event Listeners ---
    if (prevMonthButton && nextMonthButton) {
        prevMonthButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });

        nextMonthButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
    } else {
        console.warn("Previous/Next month buttons not found. Navigation disabled.");
    }


    // --- Initialisation ---
    setDailyBackground(); // Set initial background
    // Initial calendar generation needs to happen only after ensuring data is present
    if (typeof availableNewsPages !== 'undefined') {
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth()); // Generate initial calendar view
    }
    updateFooterYear(); // Set footer year
});
