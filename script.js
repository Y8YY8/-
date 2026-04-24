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
            // Crisp, premium click sound
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

    calcBtn.addEventListener('click', calculateAge);

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
            showError(`شهر ${m} عام ${y} لا يحتوي على ${d} أيام`);
            isValid = false;
        }

        if (inputDate > now) {
            showError('لا يمكن إدخال تاريخ في المستقبل');
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
            // Borrow days from the previous month of current date
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
        const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        document.getElementById('born-day').textContent = daysAr[inputDate.getDay()];

        // Moon Phase Calculation
        document.getElementById('moon-phase').innerHTML = getMoonPhase(y, m, d);

        // Hijri Age Calculation
        const diffDays = (now - inputDate) / (1000 * 60 * 60 * 24);
        const hijriYears = Math.floor(diffDays / 354.36708);
        const hijriMonths = Math.floor((diffDays % 354.36708) / 29.53059);
        document.getElementById('hijri-age').textContent = `${hijriYears} سنة و ${hijriMonths} شهر`;

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
        const totalSeconds = Math.floor(diffMs / 1000);
        
        const sleepDays = Math.floor(totalDays / 3);
        const mealsCount = totalDays * 3;

        document.getElementById('total-months').textContent = formatNumber(totalMonths);
        document.getElementById('total-weeks').textContent = formatNumber(totalWeeks);
        document.getElementById('total-days').textContent = formatNumber(totalDays);
        document.getElementById('total-hours').textContent = formatNumber(totalHours);
        document.getElementById('total-minutes').textContent = formatNumber(totalMinutes);
        document.getElementById('total-seconds').textContent = formatNumber(totalSeconds);
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
            document.getElementById('lived-time').textContent = `عشت: ${Math.floor(lifePct)}%`;
            document.getElementById('remaining-time').textContent = `متبقي: ${Math.floor(100 - lifePct)}%`;
            
            const rDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
            const rHours = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
            const rMins = Math.floor((remainingMs / (1000 * 60)) % 60);
            const rSecs = Math.floor((remainingMs / 1000) % 60);
            
            document.getElementById('life-countdown-timer').textContent = 
                `${rDays} يوم : ${String(rHours).padStart(2,'0')} : ${String(rMins).padStart(2,'0')} : ${String(rSecs).padStart(2,'0')}`;
        } else {
            document.getElementById('life-progress').style.width = '100%';
            document.getElementById('lived-time').textContent = `عشت: 100%`;
            document.getElementById('remaining-time').textContent = `متبقي: 0%`;
            document.getElementById('life-countdown-timer').textContent = "تهانينا! لقد تجاوزت متوسط العمر.";
            document.getElementById('life-countdown-timer').style.fontSize = "1.2rem";
        }
    }

    function formatNumber(num) {
        return num.toLocaleString('en-US'); // For commas
    }

    const historicalEvents = {
        1980: "تم إطلاق لعبة باكمان (Pac-Man) الشهيرة.",
        1981: "إطلاق أول كمبيوتر شخصي من شركة IBM.",
        1982: "إطلاق أول قرص مضغوط تجاري (CD).",
        1983: "ميلاد شبكة الإنترنت بشكله الحالي واعتماد بروتوكول TCP/IP.",
        1984: "إطلاق كمبيوتر ماكنتوش الأول من أبل.",
        1985: "إصدار أول نسخة من نظام التشغيل ويندوز.",
        1986: "كارثة مفاعل تشيرنوبل النووي.",
        1987: "وصول عدد سكان العالم إلى 5 مليارات نسمة.",
        1988: "إنجاز أول كابل ألياف بصرية عبر المحيط الأطلسي.",
        1989: "سقوط جدار برلين وتغيير خريطة العالم.",
        1990: "تم إطلاق تلسكوب هابل الفضائي.",
        1991: "ظهور أول موقع ويب على شبكة الإنترنت (WWW).",
        1992: "إرسال أول رسالة نصية قصيرة (SMS) في التاريخ.",
        1993: "إطلاق معالج بنتيوم من إنتل.",
        1994: "إطلاق جهاز بلايستيشن الأول.",
        1995: "إطلاق نظام التشغيل ويندوز 95 وظهور جافاسكريبت.",
        1996: "استنساخ النعجة دوللي بنجاح.",
        1997: "هزيمة بطل العالم في الشطرنج أمام حاسوب ديب بلو.",
        1998: "تأسيس شركة محرك البحث جوجل (Google).",
        1999: "تجاوز سكان العالم 6 مليارات نسمة.",
        2000: "دخول الألفية الثالثة بسلام متجاوزين أزمة Y2K.",
        2001: "إطلاق موسوعة ويكيبيديا وإطلاق أول جهاز آيبود.",
        2002: "إطلاق عملة اليورو للتداول المادي.",
        2003: "إكمال مشروع الجينوم البشري بنجاح.",
        2004: "تأسيس موقع التواصل الاجتماعي فيسبوك.",
        2005: "تأسيس وإطلاق موقع الفيديو الأول يوتيوب.",
        2006: "إطلاق موقع التدوين المصغر تويتر (Twitter).",
        2007: "الإعلان عن أول هاتف ذكي آيفون (iPhone).",
        2008: "إطلاق مصادم الهادرونات الكبير، أضخم تجربة علمية.",
        2009: "إطلاق أول عملة رقمية مشفرة، البيتكوين.",
        2010: "إطلاق تطبيق إنستغرام لتبادل الصور.",
        2011: "إرسال روبوت كيوريوسيتي إلى المريخ.",
        2012: "اكتشاف بوزون هيغز، الجسيم الملقب بجسيم الإله.",
        2013: "إطلاق جهاز ألعاب بلايستيشن 4.",
        2014: "هبوط أول مسبار بشري على سطح مذنب (المسبار فيلة).",
        2015: "اكتشاف أدلة على وجود ماء سائل على سطح المريخ.",
        2016: "هوس عالمي بظهور وإطلاق لعبة بوكيمون جو.",
        2017: "اكتشاف نظام كوكبي يحتوي على كواكب تشبه الأرض.",
        2018: "إطلاق سيارة تيسلا رودستر إلى الفضاء.",
        2019: "التقاط ونشر أول صورة حقيقية لثقب أسود في التاريخ.",
        2020: "انتشار جائحة كوفيد-19 وبداية عصر العمل عن بعد.",
        2021: "إطلاق تلسكوب جيمس ويب الفضائي الأقوى في التاريخ.",
        2022: "وصول عدد سكان كوكب الأرض رسمياً إلى 8 مليارات إنسان.",
        2023: "الانتشار المذهل للذكاء الاصطناعي التوليدي مثل ChatGPT.",
        2024: "تقدم مذهل في الذكاء الاصطناعي وبدء عصر الحوسبة المكانية."
    };

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

        document.getElementById('fact-demographic').innerHTML = `أنت أقدم في هذا العالم من حوالي <span class="highlight">${pct}%</span> من إجمالي سكان الأرض حالياً!`;

        const worldPop = 8100000000;
        const youngerPeople = Math.floor(worldPop * (pct / 100));
        const youngerFormatted = youngerPeople.toLocaleString('en-US');
        document.getElementById('fact-population').innerHTML = `يوجد تقريباً <span class="highlight">${youngerFormatted}</span> شخص أصغر منك على كوكب الأرض اليوم!`;

        let historyStr = historicalEvents[birthYear];
        if (!historyStr) {
            if (birthYear < 1980) historyStr = "لقد عاصرت بدايات التحول التكنولوجي العظيم والتطور الرقمي المذهل!";
            else historyStr = "في السنة التي ولدت فيها كانت هناك أحداث وتغيرات كبيرة ترسم المستقبل!";
        }
        document.getElementById('fact-historical').innerHTML = `في سنة ميلادك (${birthYear}): <span class="highlight">${historyStr}</span>`;

        const worldCups = [1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026];
        const presidents = [1901, 1909, 1913, 1921, 1923, 1929, 1933, 1945, 1953, 1961, 1963, 1969, 1974, 1977, 1981, 1989, 1993, 2001, 2009, 2017, 2021, 2025];
        
        const wcCount = worldCups.filter(year => year >= birthYear && year <= new Date().getFullYear()).length;
        const presCount = presidents.filter(year => year >= birthYear && year <= new Date().getFullYear()).length + 1;
        document.getElementById('fact-world').innerHTML = `🏆 لقد عاصرت <span class="highlight">${wcCount}</span> من بطولات كأس العالم، ومر عليك <span class="highlight">${presCount}</span> من رؤساء القوى العظمى!`;

        const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const dayName = daysAr[birthDate.getDay()];
        let dayFact = "";
        
        const seed = birthMonth * 31 + birthDay;
        const flavors = [
            "يقال أن الأشخاص المولودين في هذا اليوم يمتلكون طاقة إيجابية عالية.",
            "في مثل هذا اليوم من كل عام، تدور الأرض في نفس الموضع تقريباً من دورتها حول الشمس.",
            "مواليد هذا اليوم يتميزون غالباً بالإبداع والنظرة الفريدة للأمور.",
            "هل تعلم أن العديد من العظماء والقادة شاركوك نفس يوم الميلاد عبر التاريخ؟",
            "هذا اليوم يمثل لك نقطة الانطلاق في رحلة الحياة المثيرة."
        ];
        
        if (birthMonth === 0 && birthDay === 1) dayFact = "لقد ولدت في أول يوم من السنة! يا لها من بداية مميزة.";
        else if (birthMonth === 1 && birthDay === 29) dayFact = "أنت من النادرين الذين ولدوا في السنة الكبيسة، يوم ميلادك يأتي مرة كل 4 سنوات!";
        else dayFact = `لقد ولدت في يوم <span class="highlight">${dayName}</span>، ` + flavors[seed % flavors.length];

        document.getElementById('fact-day').innerHTML = dayFact;

        // Billion Seconds
        const billionMs = birthDate.getTime() + 1000000000000;
        const billionDateStr = new Date(billionMs).toLocaleDateString('ar-EG', {year: 'numeric', month: 'long', day: 'numeric'});
        if (billionMs > new Date().getTime()) {
            document.getElementById('fact-billion').innerHTML = `⏳ ستكمل <span class="highlight">مليار ثانية</span> من عمرك في تاريخ: ${billionDateStr}! جهز نفسك للاحتفال.`;
        } else {
            document.getElementById('fact-billion').innerHTML = `⏳ لقد أكملت <span class="highlight">مليار ثانية</span> من عمرك في تاريخ: ${billionDateStr}!`;
        }

        // Tech Comparisons
        let techFactStr = "";
        if (birthYear <= 1983) {
            techFactStr = `😲 أنت أقدم من <span class="highlight">شبكة الإنترنت (Internet)</span> بأكملها! لقد عاصرت العالم قبل أن يكون متصلاً بالشاشات.`;
        } else if (birthYear <= 1991) {
            techFactStr = `😲 أنت أقدم من <span class="highlight">شبكة الويب العالمية (WWW)</span>! لقد رأيت التكنولوجيا في مهدها قبل أن تغير شكل العالم.`;
        } else if (birthYear <= 1998) {
            techFactStr = `🔍 أنت أقدم من <span class="highlight">محرك بحث جوجل (Google)</span>! لقد عشت في زمن كانت فيه المعرفة تُستخرج بصعوبة من الكتب والمكتبات.`;
        } else if (birthYear <= 2004) {
            techFactStr = `🌐 أنت أقدم من <span class="highlight">موقع فيسبوك ويوتيوب</span>! لقد عاصرت الأيام الأولى الهادئة قبل ولادة ضجيج وسائل التواصل الاجتماعي.`;
        } else if (birthYear <= 2007) {
            techFactStr = `📱 أنت أقدم من <span class="highlight">أول هاتف آيفون (iPhone)</span>! لقد كنت موجوداً قبل أن تغزو الهواتف الذكية الحديثة جيوبنا وتغير حياتنا.`;
        } else if (birthYear <= 2010) {
            techFactStr = `📸 أنت أقدم من <span class="highlight">تطبيق إنستغرام وواتساب</span>! لكنك تعتبر من الجيل الذي فتح عينيه مع بداية ثورة الهواتف الذكية الحقيقية.`;
        } else if (birthYear <= 2016) {
            techFactStr = `🎵 أنت أقدم من <span class="highlight">تطبيق تيك توك (TikTok)</span>! نشأت في عالم حيث الإنترنت والهواتف جزء أساسي لا يتجزأ من الحياة.`;
        } else {
            techFactStr = `🤖 لقد ولدت في قلب عصر <span class="highlight">الذكاء الاصطناعي</span> والتكنولوجيا الفائقة! أنت أصغر سناً من معظم التقنيات والتطبيقات التي نستخدمها اليوم.`;
        }
        document.getElementById('fact-tech').innerHTML = techFactStr;

        const celebKey = `${birthMonth + 1}-${birthDay}`;
        const celebrityBirthdays = {
            "1-1": "العالم الفيزيائي ساتيندرا ناث بوز", "1-15": "مارتن لوثر كينغ الابن", "1-17": "محمد علي كلاي",
            "2-4": "روزا باركس", "2-5": "كريستيانو رونالدو", "2-11": "توماس إديسون مخترع المصباح", "2-15": "غاليليو غاليلي",
            "2-24": "ستيف جوبز مؤسس أبل", "3-14": "ألبرت أينشتاين", "4-15": "ليوناردو دا فينشي",
            "4-25": "جولييلمو ماركوني مخترع الراديو", "5-6": "سيغموند فرويد", "5-14": "مارك زوكربيرغ",
            "6-24": "ليونيل ميسي", "6-28": "إيلون ماسك", "7-1": "الأميرة ديانا", "7-18": "نيلسون مانديلا",
            "8-4": "باراك أوباما", "8-30": "وارن بافيت", "10-28": "بيل غيتس", "11-7": "ماري كوري",
            "12-25": "إسحاق نيوتن", "12-30": "ليبرون جيمس"
        };

        const exactAgeCelebs = {
            10: "رعايتك أصبحت أهم من أي وقت مضى", 12: "بداية المراهقة", 15: "الممثلة ماكينا جريس", 16: "الممثل جيكوب تريمبلاي",
            18: "اللاعبة سكاي براون", 20: "ألمع نجوم الجيل الجديد", 21: "الممثل نوح شناب", 22: "الممثلة ميلي بوبي براون",
            23: "المغنية أوليفيا رودريغو", 24: "الممثلة جينا أورتيجا", 25: "المغنية بيلي إيليش", 26: "إرلينغ هالاند",
            27: "كيليان مبابي", 28: "اليوتيوبر مستر بيست", 29: "المغنية روزي (بلاك بينك)", 30: "زيندايا وتوم هولاند",
            31: "دوا ليبا", 32: "جاستن بيبر", 33: "أريانا غراندي", 34: "سيلينا غوميز و نيمار", 35: "إد شيران",
            36: "تايلور سويفت", 37: "أديل", 38: "ريانا", 39: "ليونيل ميسي", 40: "دريك", 41: "كريستيانو رونالدو",
            42: "مارك زوكربيرغ", 43: "كريس هيمسوورث", 44: "الأمير ويليام", 45: "كيم كارداشيان", 46: "ريان غوسلينغ",
            47: "كيفن هارت", 48: "كاني ويست", 49: "توم هاردي", 50: "سيليان مورفي", 51: "ديفيد بيكهام",
            52: "ليوناردو دي كابريو", 53: "إيمينيم", 54: "دوين جونسون (ذا روك)", 55: "إيلون ماسك", 56: "مات ديمون",
            57: "ويل سميث", 58: "هيو جاكمان", 59: "فين ديزل", 60: "مايك تايسون", 61: "روبرت داوني جونيور",
            62: "براد بيت", 63: "جوني ديب", 64: "توم كروز", 65: "جورج كلوني"
        };

        if (celebrityBirthdays[celebKey]) {
            document.getElementById('fact-celebrity').innerHTML = `🌟 يا للصدفة! أنت تشارك يوم ميلادك مع <span class="highlight">${celebrityBirthdays[celebKey]}</span>.`;
        } else {
            let celebStr = exactAgeCelebs[ageY];
            if (!celebStr) {
                let closest = 30;
                for(let a in exactAgeCelebs) {
                    if (a <= ageY) closest = a;
                }
                celebStr = exactAgeCelebs[closest];
            }
            document.getElementById('fact-celebrity').innerHTML = `🧑🤝🧑 أنت الآن بنفس عمر <span class="highlight">${celebStr}</span>!`;
        }
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
            { name: "محاق", emoji: "🌑" },
            { name: "هلال متزايد", emoji: "🌒" },
            { name: "تربيع أول", emoji: "🌓" },
            { name: "أحدب متزايد", emoji: "🌔" },
            { name: "بدر", emoji: "🌕" },
            { name: "أحدب متناقص", emoji: "🌖" },
            { name: "تربيع ثاني", emoji: "🌗" },
            { name: "هلال متناقص", emoji: "🌘" }
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
                    item.style.fontSize = `${1.2 + ratio * 1.5}rem`; 
                    item.style.opacity = 0.3 + (ratio * 0.7);
                    item.style.color = ratio > 0.8 ? 'var(--primary)' : 'var(--text-main)';
                    if (ratio > 0.8) {
                        item.style.textShadow = '0 0 15px rgba(14, 165, 233, 0.4)';
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

            // Play sound if active index changes
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

        // Mouse Drag Logic
        let isDown = false;
        let startY;
        let scrollTop;

        viewport.addEventListener('mousedown', (e) => {
            initAudio(); // ensure audio initialized
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
