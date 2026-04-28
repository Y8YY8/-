document.addEventListener('DOMContentLoaded', () => {
    // Audio Context Setup
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Initialize audio on first user interactions
    document.body.addEventListener('mousedown', initAudio, { once: true });
    document.body.addEventListener('touchstart', initAudio, { once: true });
    document.body.addEventListener('keydown', initAudio, { once: true });

    function playTick() {
        if (!audioCtx || audioCtx.state !== 'running') return;
        try {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } catch (e) {
            console.error('Audio play failed', e);
        }
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    
    let getDay = setupPicker('picker-day', 1, 31, today.getDate());
    let getMonth = setupPicker('picker-month', 1, 12, today.getMonth() + 1);
    let getYear = setupPicker('picker-year', 1900, currentYear, currentYear - 20);

    const calcBtn = document.getElementById('calculate-btn');
    const globalError = document.getElementById('global-error');
    const resultsSection = document.getElementById('results-section');
    const showFullTimelineBtn = document.getElementById('show-full-timeline');
    let isFullTimelineVisible = false;

    calcBtn.addEventListener('click', calculateAge);
    showFullTimelineBtn.addEventListener('click', () => {
        isFullTimelineVisible = !isFullTimelineVisible;
        const timelineBody = document.getElementById('timeline-body');
        const rows = timelineBody.querySelectorAll('tr');
        const currentYear = new Date().getFullYear();

        rows.forEach(row => {
            const year = parseInt(row.dataset.year);
            if (isFullTimelineVisible) {
                row.style.display = 'table-row';
            } else {
                // Show 5 years before and 5 years after current year by default
                if (Math.abs(year - currentYear) > 5) {
                    row.style.display = 'none';
                } else {
                    row.style.display = 'table-row';
                }
            }
        });
        showFullTimelineBtn.textContent = isFullTimelineVisible ? 'Show Less' : 'Show Full Timeline';
    });

    function showError(message) {
        globalError.textContent = message;
        globalError.style.opacity = '1';
        globalError.style.animation = 'none';
        setTimeout(() => {
            globalError.style.animation = 'shake 0.4s ease-in-out';
        }, 10);
    }
    
    function hideError() {
        globalError.style.opacity = '0';
    }

    let liveInterval = null;

    function calculateAge() {
        hideError();
        if (liveInterval) clearInterval(liveInterval);

        const d = getDay();
        const m = getMonth();
        const y = getYear();
        
        let isValid = true;
        const now = new Date();

        const inputDate = new Date(y, m - 1, d);
        const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

        if (d > getDaysInMonth(m, y)) {
            showError(`Month ${m} of ${y} does not have ${d} days`);
            isValid = false;
        }

        if (inputDate > now) {
            showError('Date cannot be in the future');
            isValid = false;
        }

        if (!isValid) return;

        resultsSection.style.display = 'flex';

        // Base Age Calculation
        let ageY = now.getFullYear() - inputDate.getFullYear();
        let ageM = now.getMonth() - inputDate.getMonth();
        let ageD = now.getDate() - inputDate.getDate();

        if (ageD < 0) {
            ageM -= 1;
            ageD += getDaysInMonth(now.getMonth(), now.getFullYear());
        }

        if (ageM < 0) {
            ageY -= 1;
            ageM += 12;
        }

        // Animated numbers for years/months/days
        animateValue(document.getElementById('result-years'), 0, ageY, 1500);
        animateValue(document.getElementById('result-months'), 0, ageM, 1500);
        animateValue(document.getElementById('result-days'), 0, ageD, 1500);

        // Day of Week
        const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        document.getElementById('born-day').textContent = daysEn[inputDate.getDay()];

        // Zodiac Sign
        document.getElementById('zodiac-sign').innerHTML = getZodiacSign(m, d);

        // Moon Phase Calculation
        document.getElementById('moon-phase').innerHTML = getMoonPhase(y, m, d);

        // New Amazing Discovery Logic
        updateAmazingDiscovery(inputDate, ageY);

        // Life Timeline Logic
        updateLifeTimeline(inputDate, ageY);

        // Facts Data
        updateFacts(ageY, inputDate);

        // Live Counting for exact times
        updateLiveStats(inputDate);
        liveInterval = setInterval(() => {
            updateLiveStats(inputDate);
        }, 1000);
        
        // Scroll to results seamlessly
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    function updateLiveStats(birthDate) {
        const now = new Date();
        const diffMs = now - birthDate;

        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(totalDays / 7);
        const totalMonths = Math.floor(totalDays / 30.436875);
        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        
        const sleepDays = Math.floor(totalDays / 3);
        const mealsCount = totalDays * 3;

        document.getElementById('total-months').textContent = formatNumber(totalMonths);
        document.getElementById('total-weeks').textContent = formatNumber(totalWeeks);
        document.getElementById('total-days').textContent = formatNumber(totalDays);
        document.getElementById('total-hours').textContent = formatNumber(totalHours);
        document.getElementById('total-minutes').textContent = formatNumber(totalMinutes);
        document.getElementById('sleep-days').textContent = formatNumber(sleepDays);
        document.getElementById('food-meals').textContent = formatNumber(mealsCount);
        
        // Planets Age
        const marsAge = (totalDays / 687).toFixed(2);
        const jupiterAge = (totalDays / 4333).toFixed(2);
        document.getElementById('mars-age').textContent = marsAge;
        document.getElementById('jupiter-age').textContent = jupiterAge;

        // Life Countdown (assuming 72 years lifespan)
        const expectedDeath = new Date(birthDate.getTime());
        expectedDeath.setFullYear(expectedDeath.getFullYear() + 72);
        const lifeTotalMs = expectedDeath - birthDate;
        const remainingMs = expectedDeath - now;
        
        if (remainingMs > 0) {
            const lifePct = (diffMs / lifeTotalMs) * 100;
            document.getElementById('life-progress').style.width = `${lifePct}%`;
            document.getElementById('lived-time').textContent = `Lived: ${Math.round(lifePct)}%`;
            document.getElementById('remaining-time').textContent = `Remaining: ${Math.round(100 - lifePct)}%`;

            let remY = expectedDeath.getFullYear() - now.getFullYear();
            let tempDate = new Date(now);
            tempDate.setFullYear(now.getFullYear() + remY);
            if (tempDate > expectedDeath) {
                remY--;
                tempDate.setFullYear(now.getFullYear() + remY);
            }
            
            const remTimeMs = expectedDeath - tempDate;
            const rDays = Math.floor(remTimeMs / (1000 * 60 * 60 * 24));
            const rHours = Math.floor((remTimeMs / (1000 * 60 * 60)) % 24);
            const rMins = Math.floor((remTimeMs / (1000 * 60)) % 60);
            
            document.getElementById('life-countdown-timer').textContent = 
                `${remY}y : ${rDays}d : ${String(rHours).padStart(2,'0')}h : ${String(rMins).padStart(2,'0')}m`;
        } else {
            document.getElementById('life-progress').style.width = '100%';
            document.getElementById('lived-time').textContent = `Lived: 100%`;
            document.getElementById('remaining-time').textContent = `Remaining: 0%`;
            document.getElementById('life-countdown-timer').textContent = "Congratulations! You exceeded the average lifespan.";
            document.getElementById('life-countdown-timer').style.fontSize = "1.2rem";
        }

        // Next Birthday Countdown
        let nextBday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (nextBday < now) {
            nextBday.setFullYear(now.getFullYear() + 1);
        }

        const nextBdayDateStr = nextBday.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('next-birthday-date').textContent = nextBdayDateStr;

        const nextBdayMs = nextBday - now;
        const nbDays = Math.floor(nextBdayMs / (1000 * 60 * 60 * 24));
        const nbHours = Math.floor((nextBdayMs / (1000 * 60 * 60)) % 24);
        const nbMins = Math.floor((nextBdayMs / (1000 * 60)) % 60);

        document.getElementById('next-birthday-countdown').textContent =
            `${nbDays}d : ${String(nbHours).padStart(2,'0')}h : ${String(nbMins).padStart(2,'0')}m`;
    }

    function formatNumber(num) {
        return num.toLocaleString('en-US');
    }

    const historicalEvents = {
        1980: "Pac-Man was released, becoming a global phenomenon.",
        1981: "The first IBM PC was launched, revolutionizing personal computing.",
        1982: "The first commercial Compact Disc (CD) was released.",
        1983: "The Internet was born as ARPANET officially switched to TCP/IP.",
        1984: "Apple launched the first Macintosh computer.",
        1985: "Microsoft released the first version of Windows.",
        1986: "The Chernobyl nuclear disaster occurred in Ukraine.",
        1987: "The world population reached 5 billion people.",
        1988: "The first transatlantic fiber optic cable was completed.",
        1989: "The Berlin Wall fell, signaling the end of the Cold War.",
        1990: "The Hubble Space Telescope was launched into orbit.",
        1991: "The first website went live on the World Wide Web (WWW).",
        1992: "The first SMS (text message) was sent in history.",
        1993: "Intel released the first Pentium processor.",
        1994: "Sony launched the first PlayStation in Japan.",
        1995: "Windows 95 was released and JavaScript was born.",
        1996: "Dolly the Sheep became the first mammal cloned from an adult cell.",
        1997: "Deep Blue became the first computer to beat a world chess champion.",
        1998: "Google was founded by Larry Page and Sergey Brin.",
        1999: "The world population reached 6 billion people.",
        2000: "The world entered the new millennium, surviving the Y2K bug.",
        2001: "Wikipedia was launched and the first iPod was released.",
        2002: "The Euro was officially introduced as a physical currency.",
        2003: "The Human Genome Project was successfully completed.",
        2004: "Facebook was founded by Mark Zuckerberg at Harvard.",
        2005: "YouTube was founded and the first video was uploaded.",
        2006: "Twitter was launched, introducing microblogging to the world.",
        2007: "Apple announced the first iPhone, changing the world forever.",
        2008: "The Large Hadron Collider, the world's largest scientific experiment, was launched.",
        2009: "The first cryptocurrency, Bitcoin, was launched.",
        2010: "Instagram was launched as a photo-sharing app.",
        2011: "NASA's Curiosity rover was sent to explore Mars.",
        2012: "The Higgs Boson particle was discovered at CERN.",
        2013: "Sony launched the PlayStation 4.",
        2014: "The Philae probe made the first landing on a comet.",
        2015: "Evidence of liquid water on Mars was discovered.",
        2016: "Pokémon GO was released, creating a global AR craze.",
        2017: "The TRAPPIST-1 system with seven Earth-sized planets was discovered.",
        2018: "SpaceX launched a Tesla Roadster into deep space.",
        2019: "The first-ever real image of a black hole was captured and published.",
        2020: "The COVID-19 pandemic began, changing how the world works.",
        2021: "The James Webb Space Telescope, the most powerful ever, was launched.",
        2022: "The world population officially reached 8 billion people.",
        2023: "Generative AI like ChatGPT exploded in popularity and capability.",
        2024: "Advancements in AI continue to accelerate into the era of spatial computing."
    };

    const historicalMonthEvents = {
        1: "The first iPhone was announced (2007) and the Euro became official (2002).",
        2: "Facebook was founded (2004) and Pluto was discovered (1930).",
        3: "The World Wide Web proposal was published (1989) and Einstein was born (1879).",
        4: "Microsoft was founded (1975) and the first space shuttle was launched (1981).",
        5: "The first movie of Star Wars was released (1977) and Everest was first climbed (1953).",
        6: "The first iPad was released (2010) and the Internet reached 1 billion users (2005).",
        7: "The first man walked on the Moon (1969) and Live Aid concerts were held (1985).",
        8: "Google was incorporated (1998) and the first website went live (1991).",
        9: "The first text message was sent (1992) and the PC revolution began (1981).",
        10: "The first-ever email was sent (1971) and the Space Age began with Sputnik (1957).",
        11: "The Berlin Wall fell (1989) and the first Xbox was released (2001).",
        12: "The Wright Brothers made their first flight (1903) and DNA structure was modeled (1953)."
    };

    const ageMilestones = [
        { age: 10, person: "Malala Yousafzai", action: "started her blog for the BBC" },
        { age: 12, person: "Anne Frank", action: "received her famous diary" },
        { age: 16, person: "Greta Thunberg", action: "started her climate strike" },
        { age: 17, person: "Bill Gates", action: "sold his first computer program" },
        { age: 19, person: "Mark Zuckerberg", action: "founded Facebook" },
        { age: 20, person: "Steve Jobs", action: "co-founded Apple" },
        { age: 21, person: "Elon Musk", action: "started his first company, Zip2" },
        { age: 23, person: "Jane Goodall", action: "began her research in Gombe" },
        { age: 26, person: "Albert Einstein", action: "published the theory of relativity" },
        { age: 30, person: "Jeff Bezos", action: "founded Amazon" },
        { age: 33, person: "Alexander the Great", action: "had conquered most of the known world" },
        { age: 40, person: "Stan Lee", action: "created the Fantastic Four" },
        { age: 52, person: "Ray Kroc", action: "bought McDonald's" },
        { age: 62, person: "Colonel Sanders", action: "started KFC" }
    ];

    const ageAdvice = [
        { min: 0, max: 2, tips: ["Cherish every giggle and milestone; their brain is growing faster now than it ever will again.", "Play is the best way for them to learn about the world and bond with you.", "Ensure they get plenty of sleep; it's when their little bodies do most of their growing."] },
        { min: 3, max: 5, tips: ["Encourage their curiosity; every 'why' is a step toward understanding their world.", "Read together every day to build a lifelong love for stories and learning.", "Physical activity is key; let them run, jump, and explore to build strong muscles."] },
        { min: 6, max: 12, tips: ["Support their hobbies; this is a great time for them to discover what they truly love.", "Consistency and routine help them feel secure and focused at school.", "Teach them the value of kindness and empathy through your own daily actions."] },
        { min: 13, max: 17, tips: ["Listen more than you talk; they're finding their own voice and need to feel heard.", "Encourage healthy screen-time habits to balance digital life with real-world experiences.", "Celebrate their independence while staying a steady, supportive presence in their life."] },
        { min: 18, max: 22, tips: ["At age 21, most physical growth is complete. Focus on nourishing your body for the long term.", "This is a key time to build financial habits that will serve you for decades to come.", "Travel or explore new cultures; your perspective is expanding more than ever right now."] },
        { min: 23, max: 30, tips: ["Prioritize quality sleep; it's the foundation for your mental clarity and physical energy.", "Invest in your friendships; the bonds you strengthen now can last a lifetime.", "Don't be afraid to take calculated risks in your career while you have the flexibility."] },
        { min: 31, max: 40, tips: ["Starting around 40, your eyes may begin to have trouble focusing on close objects. Regular checkups help!", "Strength training becomes more important now to maintain bone density and muscle mass.", "Balance is key; make time for self-care to manage the demands of work and family life."] },
        { min: 41, max: 50, tips: ["Focus on heart health; a balanced diet and regular cardio are your best long-term investments.", "Stay curious! Learning a new skill now keeps your brain sharp and your spirit young.", "Prioritize experiences over things; the memories you make now will be your greatest treasures."] },
        { min: 51, max: 65, tips: ["Pay attention to joint health; if you feel persistent pain, consult a specialist to stay active.", "Keep your mind engaged with puzzles, reading, or social clubs to maintain cognitive health.", "Regular health screenings are vital now to catch and manage any changes early and effectively."] },
        { min: 66, max: 80, tips: ["Stay social! Connecting with friends and family is one of the best ways to boost your mood.", "Gentle movement like walking or swimming keeps your circulation and flexibility at their best.", "Share your wisdom; your life experiences are a valuable gift to the younger generations."] },
        { min: 81, max: 120, tips: ["Focus on gratitude; reflecting on positive memories can bring a deep sense of peace.", "Stay hydrated and enjoy small, nutritious meals to keep your energy levels steady.", "Surround yourself with things that bring you joy, whether it's music, art, or loved ones."] }
    ];

    function updateAmazingDiscovery(birthDate, ageY) {
        const month = birthDate.getMonth() + 1;
        const day = birthDate.getDate();
        const year = birthDate.getFullYear();

        // Age Advice Logic
        const adviceGroup = ageAdvice.find(group => ageY >= group.min && ageY <= group.max);
        if (adviceGroup) {
            const randomTip = adviceGroup.tips[Math.floor(Math.random() * adviceGroup.tips.length)];
            const icons = ["💡", "✨", "🌟", "🛡️", "🌱", "🧘"];
            const randomIcon = icons[Math.floor(Math.random() * icons.length)];

            document.getElementById('val-advice').textContent = randomTip;
            document.getElementById('icon-advice').textContent = randomIcon;

            // Randomize the glow color slightly for unique experience (Silver/Metallic tones)
            const hues = [210, 220, 200, 190]; // Shades of Silver/Steel Blue
            const randomHue = hues[Math.floor(Math.random() * hues.length)];
            const color = `hsl(${randomHue}, 20%, 80%)`;
            document.getElementById('advice-card').style.setProperty('--advice-color', color);
            document.getElementById('icon-advice').style.background = `hsla(${randomHue}, 20%, 80%, 0.1)`;
            document.getElementById('icon-advice').style.color = '#ffffff';
        }

        // Season Logic
        let season = "";
        let emoji = "";
        if ((month === 12 && day >= 21) || month <= 2 || (month === 3 && day < 20)) {
            season = "Winter"; emoji = "❄️";
        } else if ((month === 3 && day >= 20) || month <= 5 || (month === 6 && day < 21)) {
            season = "Spring"; emoji = "🌱";
        } else if ((month === 6 && day >= 21) || month <= 8 || (month === 9 && day < 22)) {
            season = "Summer"; emoji = "☀️";
        } else {
            season = "Autumn"; emoji = "🍂";
        }
        document.getElementById('val-season').textContent = season;
        document.getElementById('icon-season').textContent = emoji;

        // Life Stage Logic
        const stage = getLifeStage(ageY);
        document.getElementById('val-stage').textContent = stage.name;

        // Milestone Logic
        let milestone = ageMilestones.find(m => m.age >= ageY) || ageMilestones[ageMilestones.length - 1];
        document.getElementById('val-milestone').innerHTML = `<span style="color:var(--primary)">${milestone.person}</span> ${milestone.action}.`;

        // Historic Event Logic
        document.getElementById('label-event').textContent = `In your birth month (${birthDate.toLocaleString('en-US', {month: 'long'})}):`;
        document.getElementById('val-event').textContent = historicalMonthEvents[month];

        // World Changes
        const now = new Date();
        const yearsLived = (now - birthDate) / (1000 * 60 * 60 * 24 * 365.25);
        const populationGrowth = Math.floor(yearsLived * 80000000); // Rough estimate of annual growth
        const earthTravel = Math.floor(yearsLived * 940000000); // Earth travels ~940 million km per year around Sun

        document.getElementById('fact-world-changes').innerHTML = `🌍 Since you were born, the world population has grown by approximately <span class="highlight">${formatNumber(populationGrowth)}</span> people.`;
        document.getElementById('fact-earth-travel').innerHTML = `🌌 You have traveled about <span class="highlight">${formatNumber(earthTravel)} km</span> through space as Earth orbits the Sun!`;
    }

    const lifeStages = [
        { max: 1, name: "Infancy (Breastfeeding)", label: "Infancy" },
        { max: 3, name: "Early Childhood", label: "Toddler" },
        { max: 6, name: "Preschool Years", label: "Childhood" },
        { max: 12, name: "Middle Childhood", label: "School Age" },
        { max: 14, name: "Early Adolescence", label: "Early Teen" },
        { max: 17, name: "Middle Adolescence", label: "Adolescence" },
        { max: 21, name: "Late Adolescence", label: "Young Adult" },
        { max: 35, name: "Early Adulthood", label: "Adult" },
        { max: 50, name: "Middle Adulthood", label: "Midlife" },
        { max: 65, name: "Late Adulthood", label: "Mature" },
        { max: 100, name: "Late Seniority", label: "Senior" }
    ];

    function getLifeStage(age) {
        return lifeStages.find(s => age <= s.max) || lifeStages[lifeStages.length - 1];
    }

    function updateLifeTimeline(birthDate, currentAge) {
        const timelineBody = document.getElementById('timeline-body');
        timelineBody.innerHTML = '';
        const now = new Date();
        const currentYear = now.getFullYear();

        // Generate rows for 100 years
        for (let i = 0; i <= 100; i++) {
            const year = birthDate.getFullYear() + i;
            const stage = getLifeStage(i);
            const row = document.createElement('tr');
            row.dataset.year = year;

            if (i === currentAge) {
                row.className = 'current-age';
            } else if (year > currentYear) {
                row.className = 'future-age';
            }

            // Default display logic: show around current year
            if (Math.abs(year - currentYear) > 5) {
                row.style.display = 'none';
            }

            row.innerHTML = `
                <td>${year}</td>
                <td>${i === 0 ? 'Birth' : i + ' y.o.'}</td>
                <td>${stage.name}</td>
            `;
            timelineBody.appendChild(row);
        }

        isFullTimelineVisible = false;
        showFullTimelineBtn.textContent = 'Show Full Timeline';
    }

    function updateFacts(ageY, birthDate) {
        const birthYear = birthDate.getFullYear();
        const birthMonth = birthDate.getMonth();
        const birthDay = birthDate.getDate();

        let pct = 0;
        if (ageY < 15) pct = ageY * 1.7; 
        else if (ageY < 30) pct = 25 + (ageY - 15) * 1.6;
        else if (ageY < 50) pct = 49 + (ageY - 30) * 1.3;
        else if (ageY < 70) pct = 75 + (ageY - 50) * 0.9;
        else pct = 93 + (ageY - 70) * 0.3;
        pct = Math.min(pct, 99.9).toFixed(1);

        document.getElementById('fact-demographic').innerHTML = `You are older than approximately <span class="highlight">${pct}%</span> of the world's population!`;

        const worldPop = 8100000000;
        const youngerPeople = Math.floor(worldPop * (pct / 100));
        const youngerFormatted = youngerPeople.toLocaleString('en-US');
        document.getElementById('fact-population').innerHTML = `There are approximately <span class="highlight">${youngerFormatted}</span> people younger than you on Earth today!`;

        let historyStr = historicalEvents[birthYear];
        if (!historyStr) {
            if (birthYear < 1980) historyStr = "You have lived through the greatest technological transformation in history!";
            else historyStr = "Major events were shaping the future during the year you were born!";
        }
        document.getElementById('fact-historical').innerHTML = `In the year you were born (${birthYear}): <span class="highlight">${historyStr}</span>`;

        const worldCups = [1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026];
        const presidents = [1901, 1909, 1913, 1921, 1923, 1929, 1933, 1945, 1953, 1961, 1963, 1969, 1974, 1977, 1981, 1989, 1993, 2001, 2009, 2017, 2021, 2025];
        
        const wcCount = worldCups.filter(year => year >= birthYear && year <= new Date().getFullYear()).length;
        const presCount = presidents.filter(year => year >= birthYear && year <= new Date().getFullYear()).length + 1;
        document.getElementById('fact-world').innerHTML = `🏆 You've witnessed <span class="highlight">${wcCount}</span> World Cups and <span class="highlight">${presCount}</span> U.S. Presidential terms!`;

        const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = daysEn[birthDate.getDay()];
        let dayFact = "";
        
        const seed = birthMonth * 31 + birthDay;
        const flavors = [
            "People born on this day are often said to possess high positive energy.",
            "Every year on this day, the Earth is in roughly the same position in its orbit around the Sun.",
            "Those born today are often characterized by creativity and a unique perspective.",
            "Many great leaders and visionaries have shared your birthday throughout history.",
            "This day marks your personal starting point in the exciting journey of life."
        ];
        
        if (birthMonth === 0 && birthDay === 1) dayFact = "You were born on New Year's Day! What a brilliant start.";
        else if (birthMonth === 1 && birthDay === 29) dayFact = "You are one of the rare individuals born on a Leap Day! Your birthday only comes once every 4 years.";
        else dayFact = `You were born on a <span class="highlight">${dayName}</span>, and ` + flavors[seed % flavors.length];

        document.getElementById('fact-day').innerHTML = dayFact;

        // Billion Seconds
        const billionMs = birthDate.getTime() + 1000000000000;
        const billionDateStr = new Date(billionMs).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
        if (billionMs > new Date().getTime()) {
            document.getElementById('fact-billion').innerHTML = `⏳ You will complete <span class="highlight">one billion seconds</span> of life on: ${billionDateStr}! Get ready to celebrate.`;
        } else {
            document.getElementById('fact-billion').innerHTML = `⏳ You completed <span class="highlight">one billion seconds</span> of life on: ${billionDateStr}!`;
        }

        // Tech Comparisons
        let techFactStr = "";
        if (birthYear <= 1983) {
            techFactStr = `😲 You are older than the <span class="highlight">Internet</span> itself! You've seen the world before it was connected by screens.`;
        } else if (birthYear <= 1991) {
            techFactStr = `😲 You are older than the <span class="highlight">World Wide Web</span>! You saw technology in its infancy before it changed everything.`;
        } else if (birthYear <= 1998) {
            techFactStr = `🔍 You are older than <span class="highlight">Google</span>! You lived in a time when knowledge was sought in libraries and books.`;
        } else if (birthYear <= 2004) {
            techFactStr = `🌐 You are older than <span class="highlight">Facebook and YouTube</span>! You experienced the quiet days before the social media boom.`;
        } else if (birthYear <= 2007) {
            techFactStr = `📱 You are older than the <span class="highlight">iPhone</span>! You existed before smartphones invaded our pockets and lives.`;
        } else if (birthYear <= 2010) {
            techFactStr = `📸 You are older than <span class="highlight">Instagram and WhatsApp</span>! But you belong to the generation that grew up with the mobile revolution.`;
        } else if (birthYear <= 2016) {
            techFactStr = `🎵 You are older than <span class="highlight">TikTok</span>! You were raised in a world where the internet was already a part of life.`;
        } else {
            techFactStr = `🤖 You were born in the heart of the <span class="highlight">AI era</span>! You are younger than most of the technologies we use today.`;
        }
        document.getElementById('fact-tech').innerHTML = techFactStr;

        const celebKey = `${birthMonth + 1}-${birthDay}`;
        const celebrityBirthdays = {
            "1-1": "Physicist Satyendra Nath Bose", "1-15": "Martin Luther King Jr.", "1-17": "Muhammad Ali",
            "2-4": "Rosa Parks", "2-5": "Cristiano Ronaldo", "2-11": "Thomas Edison", "2-15": "Galileo Galilei",
            "2-24": "Steve Jobs", "3-14": "Albert Einstein", "4-15": "Leonardo da Vinci",
            "4-25": "Guglielmo Marconi", "5-6": "Sigmund Freud", "5-14": "Mark Zuckerberg",
            "6-24": "Lionel Messi", "6-28": "Elon Musk", "7-1": "Princess Diana", "7-18": "Nelson Mandela",
            "8-4": "Barack Obama", "8-30": "Warren Buffett", "10-28": "Bill Gates", "11-7": "Marie Curie",
            "12-25": "Isaac Newton", "12-30": "LeBron James"
        };

        const exactAgeCelebs = {
            10: "Care is more important now than ever", 12: "Beginning of adolescence", 15: "Actress Mckenna Grace", 16: "Actor Jacob Tremblay",
            18: "Skateboarder Sky Brown", 20: "Brightest stars of the new generation", 21: "Actor Noah Schnapp", 22: "Actress Millie Bobby Brown",
            23: "Singer Olivia Rodrigo", 24: "Actress Jenna Ortega", 25: "Singer Billie Eilish", 26: "Erling Haaland",
            27: "Kylian Mbappé", 28: "YouTuber MrBeast", 29: "Singer Rosé (Blackpink)", 30: "Zendaya and Tom Holland",
            31: "Dua Lipa", 32: "Justin Bieber", 33: "Ariana Grande", 34: "Selena Gomez and Neymar", 35: "Ed Sheeran",
            36: "Taylor Swift", 37: "Adele", 38: "Rihanna", 39: "Lionel Messi", 40: "Drake", 41: "Cristiano Ronaldo",
            42: "Mark Zuckerberg", 43: "Chris Hemsworth", 44: "Prince William", 45: "Kim Kardashian", 46: "Ryan Gosling",
            47: "Kevin Hart", 48: "Kanye West", 49: "Tom Hardy", 50: "Cillian Murphy", 51: "David Beckham",
            52: "Leonardo DiCaprio", 53: "Eminem", 54: "Dwayne Johnson (The Rock)", 55: "Elon Musk", 56: "Matt Damon",
            57: "Will Smith", 58: "Hugh Jackman", 59: "Vin Diesel", 60: "Mike Tyson", 61: "Robert Downey Jr.",
            62: "Brad Pitt", 63: "Johnny Depp", 64: "Tom Cruise", 65: "George Clooney"
        };

        if (celebrityBirthdays[celebKey]) {
            document.getElementById('fact-celebrity').innerHTML = `🌟 What a coincidence! You share your birthday with <span class="highlight">${celebrityBirthdays[celebKey]}</span>.`;
        } else {
            let celebStr = exactAgeCelebs[ageY];
            if (!celebStr) {
                let closest = 30;
                for(let a in exactAgeCelebs) {
                    if (parseInt(a) <= ageY) closest = a;
                }
                celebStr = exactAgeCelebs[closest];
            }
            document.getElementById('fact-celebrity').innerHTML = `🧑🤝🧑 You are now the same age as <span class="highlight">${celebStr}</span>!`;
        }
    }

    function getZodiacSign(month, day) {
        const zodiacSigns = [
            { name: "Capricorn", emoji: "♑", start: [12, 22], end: [1, 19], desc: "Practical, ambitious, and disciplined. You are a natural leader who values hard work and long-term goals." },
            { name: "Aquarius", emoji: "♒", start: [1, 20], end: [2, 18], desc: "Innovative, progressive, and independent. You are a visionary who loves to think outside the box." },
            { name: "Pisces", emoji: "♓", start: [2, 19], end: [3, 20], desc: "Compassionate, artistic, and intuitive. You have a deep emotional understanding of the world around you." },
            { name: "Aries", emoji: "♈", start: [3, 21], end: [4, 19], desc: "Bold, ambitious, and energetic. You are a pioneer who loves to take on new challenges with courage." },
            { name: "Taurus", emoji: "♉", start: [4, 20], end: [5, 20], desc: "Reliable, patient, and practical. You value stability and appreciate the finer things in life." },
            { name: "Gemini", emoji: "♊", start: [5, 21], end: [6, 20], desc: "Adaptable, outgoing, and intelligent. You are a great communicator who is always curious about the world." },
            { name: "Cancer", emoji: "♋", start: [6, 21], end: [7, 22], desc: "Nurturing, intuitive, and protective. You have a strong connection to your home and loved ones." },
            { name: "Leo", emoji: "♌", start: [7, 23], end: [8, 22], desc: "Confident, charismatic, and generous. You are a natural-born leader who loves to be in the spotlight." },
            { name: "Virgo", emoji: "♍", start: [8, 23], end: [9, 22], desc: "Analytical, organized, and kind. You have a sharp eye for detail and love to be of service to others." },
            { name: "Libra", emoji: "♎", start: [9, 23], end: [10, 22], desc: "Diplomatic, fair, and social. You value harmony and strive to find balance in all areas of life." },
            { name: "Scorpio", emoji: "♏", start: [10, 23], end: [11, 21], desc: "Passionate, resourceful, and brave. You have a powerful presence and a deep sense of loyalty." },
            { name: "Sagittarius", emoji: "♐", start: [11, 22], end: [12, 21], desc: "Optimistic, adventurous, and philosophical. You love to explore new ideas and travel the world." }
        ];

        let sign = zodiacSigns.find(s => {
            const [sM, sD] = s.start;
            const [eM, eD] = s.end;
            if (sM === 12 && month === 12 && day >= sD) return true;
            if (sM === 12 && month === 1 && day <= eD) return true;
            return (month === sM && day >= sD) || (month === eM && day <= eD);
        });

        if (!sign) sign = zodiacSigns[0]; // Fallback to Capricorn

        return `<span style="color:var(--primary)">${sign.emoji} ${sign.name}</span><br><p style="font-size:0.85rem; font-weight:400; margin-top:5px; color:var(--text-muted)">${sign.desc}</p>`;
    }

    function getMoonPhase(year, month, day) {
        let c = 0, e = 0, jd = 0, b = 0;
        if (month < 3) {
            year--;
            month += 12;
        }
        ++month;
        c = 365.25 * year;
        e = 30.6 * month;
        jd = c + e + day - 694039.09; 
        jd /= 29.5305882;
        b = parseInt(jd);
        jd -= b;
        b = Math.round(jd * 8);
        if (b >= 8) b = 0;
        
        const phases = [
            { name: "New Moon", emoji: "🌑" },
            { name: "Waxing Crescent", emoji: "🌒" },
            { name: "First Quarter", emoji: "🌓" },
            { name: "Waxing Gibbous", emoji: "🌔" },
            { name: "Full Moon", emoji: "🌕" },
            { name: "Waning Gibbous", emoji: "🌖" },
            { name: "Last Quarter", emoji: "🌗" },
            { name: "Waning Crescent", emoji: "🌘" }
        ];
        return `${phases[b].emoji} ${phases[b].name}`;
    }

    function setupPicker(vpId, min, max, defaultValue) {
        const viewport = document.getElementById(vpId);
        viewport.innerHTML = '';
        const items = [];
        
        for (let i = min; i <= max; i++) {
            const item = document.createElement('div');
            item.className = 'picker-item';
            item.textContent = String(i).padStart(vpId === 'picker-year' ? 4 : 2, '0');
            item.dataset.value = i;
            viewport.appendChild(item);
            items.push(item);
        }
        
        const itemHeight = 60;
        let lastActiveIndex = -1;
        
        function updateActive() {
            const center = viewport.scrollTop + (viewport.clientHeight / 2);
            let closestDis = Infinity;
            let closestItem = null;
            let newActiveIndex = -1;
            
            items.forEach((item, index) => {
                const itemCenter = (index * itemHeight) + 60 + (itemHeight / 2);
                const dist = Math.abs(center - itemCenter);
                const maxDist = itemHeight * 2;
                
                if (dist < maxDist) {
                    const ratio = Math.max(0, 1 - (dist / (itemHeight * 1.5)));
                    // Scale down the font-size slightly for better fit on mobile
                    const baseSize = window.innerWidth < 480 ? 1.0 : 1.2;
                    const scaleFactor = window.innerWidth < 480 ? 0.8 : 1.5;
                    item.style.fontSize = `${baseSize + ratio * scaleFactor}rem`;
                    item.style.opacity = 0.3 + (ratio * 0.7);
                    item.style.color = ratio > 0.8 ? 'var(--primary)' : 'var(--text-main)';
                    if (ratio > 0.8) {
                item.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.2)';
                        item.classList.add('active');
                        newActiveIndex = index;
                    } else {
                        item.style.textShadow = 'none';
                        item.classList.remove('active');
                    }
                } else {
                    item.style.fontSize = '1.2rem';
                    item.style.opacity = '0.3';
                    item.style.color = 'var(--text-main)';
                    item.style.textShadow = 'none';
                    item.classList.remove('active');
                }
            });

            if (newActiveIndex !== -1 && lastActiveIndex !== -1 && newActiveIndex !== lastActiveIndex) {
                playTick();
            }
            if (newActiveIndex !== -1) {
                lastActiveIndex = newActiveIndex;
            }
        }

        viewport.addEventListener('scroll', () => {
            window.requestAnimationFrame(updateActive);
        });

        let isDown = false;
        let startY;
        let scrollTop;

        viewport.addEventListener('mousedown', (e) => {
            initAudio();
            isDown = true;
            viewport.style.cursor = 'grabbing';
            viewport.style.scrollSnapType = 'none';
            startY = e.pageY - viewport.offsetTop;
            scrollTop = viewport.scrollTop;
            e.preventDefault();
        });
        
        const endDrag = () => {
            if (!isDown) return;
            isDown = false;
            viewport.style.cursor = 'grab';
            viewport.style.scrollSnapType = 'y mandatory';
            const index = Math.round(viewport.scrollTop / itemHeight);
            viewport.scrollTo({
                top: Math.max(0, Math.min(index, items.length - 1)) * itemHeight,
                behavior: 'smooth'
            });
        };

        viewport.addEventListener('mouseleave', endDrag);
        viewport.addEventListener('mouseup', endDrag);
        
        viewport.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const y = e.pageY - viewport.offsetTop;
            const walk = (y - startY) * 1.5;
            viewport.scrollTop = scrollTop - walk;
        });

        items.forEach((item, index) => {
            item.addEventListener('click', () => {
                viewport.style.scrollSnapType = 'y mandatory';
                viewport.scrollTo({
                    top: index * itemHeight,
                    behavior: 'smooth'
                });
            });
        });

        setTimeout(() => {
            const defIndex = items.findIndex(i => parseInt(i.dataset.value) === defaultValue);
            if (defIndex !== -1) {
                viewport.scrollTo({ top: defIndex * itemHeight, behavior: 'auto' });
                lastActiveIndex = defIndex;
            }
            updateActive();
        }, 100);

        return () => {
            const active = viewport.querySelector('.picker-item.active');
            if (active) return parseInt(active.dataset.value);
            const index = Math.round(viewport.scrollTop / itemHeight);
            return items[index] ? parseInt(items[index].dataset.value) : defaultValue;
        };
    }

    function animateValue(obj, start, end, duration) {
        if (end === 0) {
            obj.innerHTML = '0';
            return;
        }
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            obj.innerHTML = Math.floor(easeProgress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    }
});
